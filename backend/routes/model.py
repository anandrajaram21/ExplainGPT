from fastapi import APIRouter, Request
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import numpy as np
from schemas import PromptInput, ModelNameInput, PlaygroundInput, ChatInput
from model.main import load_model
from logger import get_logger
from fastapi.responses import StreamingResponse
import json
import asyncio
from typing import AsyncIterable, List

logger = get_logger(__name__)
router = APIRouter()


@router.post("/change_model")
def change_model(model_name: ModelNameInput, request: Request):
    logger.info(f"Changing model to: {model_name.model_name}")
    try:
        tokenizer, model, pipeline = load_model(model_name.model_name)
        request.app.state.model = model
        request.app.state.tokenizer = tokenizer
        request.app.state.pipeline = pipeline
        logger.info(f"Model changed successfully to {model_name.model_name}")
        return {"status": 200, "message": "Changed successfully"}
    except Exception as e:
        logger.error(f"Error changing model to {model_name.model_name}: {str(e)}", exc_info=True)
        return {"status": 500, "message": f"Error changing model: {str(e)}"}


@router.post("/generate")
def generate(prompt: PromptInput, request: Request):
    logger.info(f"Generate request received with max_length={prompt.max_length}")
    logger.debug(f"Prompt text: {prompt.text[:50]}...")  # Log first 50 chars of prompt
    
    pipeline = request.app.state.pipeline

    if pipeline is None:
        logger.error("Pipeline not found")
        return {"status": 400, "message": "Pipeline not found"}

    try:
        logger.debug("Starting text generation")
        output = pipeline(prompt.text, max_length=prompt.max_length, num_return_sequences=1)
        output_text = output[0]["generated_text"]
        logger.debug(f"Generation completed, output length: {len(output_text)}")
        logger.debug(f"Output (first 50 chars): {output_text[:50]}...")
        
        return {"status": 200, "output": output_text}
    except Exception as e:
        logger.error(f"Error in text generation: {str(e)}", exc_info=True)
        return {"status": 500, "message": f"Error generating text: {str(e)}"}




@router.post("/token_probs")
def token_probs(prompt: PromptInput, request: Request):
    logger.info(f"Token probabilities request received with max_length={prompt.max_length}")
    logger.debug(f"Prompt text: {prompt.text[:50]}...")
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    input_prompt = prompt.text
    max_tokens = prompt.max_length

    if model is None:
        logger.error("Model not found")
        return {"status": 400, "message": "Model not found"}
    if tokenizer is None:
        logger.error("Tokenizer not found")
        return {"status": 400, "message": "Tokenizer not found"}

    try:
        logger.debug("Tokenizing input")
        inputs = tokenizer([input_prompt], return_tensors="pt")
        
        logger.debug(f"Generating with max_new_tokens={max_tokens}")
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            return_dict_in_generate=True,
            output_scores=True,
            output_logits=True
        )
        
        logger.debug("Computing transition scores")
        transition_scores = model.compute_transition_scores(
            outputs.sequences, outputs.scores, normalize_logits=True
        )

        input_length = 1 if model.config.is_encoder_decoder else inputs.input_ids.shape[1]
        generated_tokens = outputs.sequences[:, input_length:]

        logger.debug(f"Processing {len(generated_tokens[0])} generated tokens")
        response_data = []
        for i, (token_id, score, logits) in enumerate(
            zip(generated_tokens[0], transition_scores[0], outputs.scores)
        ):
            logits = logits[0]  # remove batch dimension
            probs = torch.nn.functional.softmax(logits, dim=-1)
            sorted_probs, sorted_indices = torch.sort(probs, descending=True)

            top_k = 10
            step_data = {
                "step": i + 1,
                "generated_token": {
                    "id": token_id.item(),
                    "text": tokenizer.decode(token_id),
                    "score": float(score.numpy()),
                    "probability": float(np.exp(score.numpy())),
                },
                "top_alternatives": [],
            }

            for idx in range(top_k):
                tok_id = sorted_indices[idx].item()
                prob = sorted_probs[idx].item()
                step_data["top_alternatives"].append(
                    {
                        "id": tok_id,
                        "text": tokenizer.decode([tok_id]),
                        "probability": float(prob),
                        "selected": tok_id == token_id.item(),
                    }
                )

            response_data.append(step_data)

        logger.info(f"Token probabilities calculated successfully for {len(response_data)} tokens")
        return {"status": 200, "token_probs": response_data}
    except Exception as e:
        logger.error(f"Error calculating token probabilities: {str(e)}", exc_info=True)
        return {"status": 500, "message": f"Error calculating token probabilities: {str(e)}"}


@router.post("/playground")
def playground(config: PlaygroundInput, request: Request):
    logger.info(f"Playground request received with params: temp={config.temperature}, top_k={config.top_k}, top_p={config.top_p}, max_length={config.max_length}")
    logger.debug(f"Prompt text: {config.text[:50]}...")
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    if model is None:
        logger.error("Model not found")
        return {"status": 400, "message": "Model not found"}
    if tokenizer is None:
        logger.error("Tokenizer not found")
        return {"status": 400, "message": "Tokenizer not found"}

    try:
        logger.debug("Tokenizing input")
        inputs = tokenizer([config.text], return_tensors="pt")
        
        logger.debug(f"Generating with parameters: temp={config.temperature}, top_k={config.top_k}, top_p={config.top_p}, max_new_tokens={config.max_length}")
        outputs = model.generate(
            **inputs,
            do_sample=True,
            temperature=config.temperature,
            top_k=config.top_k,
            top_p=config.top_p,
            max_new_tokens=config.max_length,
            num_return_sequences=config.num_return_sequences,
            return_dict_in_generate=True
        )
        
        input_length = 1 if model.config.is_encoder_decoder else inputs.input_ids.shape[1]
        generated_sequences = outputs.sequences[:, input_length:]
        
        logger.debug("Decoding generated sequences")
        generated_texts = []
        for seq in generated_sequences:
            generated_text = tokenizer.decode(seq, skip_special_tokens=True)
            generated_texts.append(generated_text)
        
        logger.info(f"Playground generation completed successfully, generated {len(generated_texts)} sequences")
        return {
            "status": 200, 
            "outputs": generated_texts,
            "parameters": {
                "temperature": config.temperature,
                "top_k": config.top_k,
                "top_p": config.top_p,
                "max_length": config.max_length,
                "num_return_sequences": config.num_return_sequences
            }
        }
    except Exception as e:
        logger.error(f"Error in playground text generation: {str(e)}", exc_info=True)
        return {"status": 500, "message": f"Error generating text: {str(e)}"}


@router.post("/chat")
async def chat(chat_input: ChatInput, request: Request):
    logger.info(f"Chat request received with temperature={chat_input.temperature}, max_tokens={chat_input.max_tokens}, stream={chat_input.stream}")
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    if model is None:
        logger.error("Model not found")
        return {"status": 400, "message": "Model not found"}
    if tokenizer is None:
        logger.error("Tokenizer not found")
        return {"status": 400, "message": "Tokenizer not found"}

    # Format the prompt from messages
    chat_str = ""
    for msg in chat_input.messages:
        if msg.role == "user":
            chat_str += f"User: {msg.content}\n"
        elif msg.role == "assistant":
            chat_str += f"Assistant: {msg.content}\n"
    
    # Add the final prompt for assistant to respond to
    chat_str += "Assistant: "
    
    logger.debug(f"Formatted chat prompt: {chat_str[:100]}...")

    # Default max tokens if not specified or too large
    max_tokens = min(chat_input.max_tokens, 300) if chat_input.max_tokens else 300
    logger.debug(f"Using max_tokens={max_tokens} for chat generation")

    if chat_input.stream:
        return StreamingResponse(
            generate_stream(model, tokenizer, chat_str, chat_input),
            media_type="text/event-stream"
        )
    else:
        try:
            logger.debug("Tokenizing input")
            inputs = tokenizer([chat_str], return_tensors="pt")
            
            logger.debug(f"Generating with temperature={chat_input.temperature}, max_tokens={max_tokens}")
            outputs = model.generate(
                **inputs,
                do_sample=True,
                temperature=chat_input.temperature,
                max_new_tokens=max_tokens,
                output_hidden_states=False
            )
            
            logger.debug("Decoding generated text")
            generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the assistant's response
            assistant_response = generated_text[len(chat_str):]
            
            return {"status": 200, "output": assistant_response}
        except Exception as e:
            logger.error(f"Error in chat generation: {str(e)}", exc_info=True)
            return {"status": 500, "message": f"Error generating chat response: {str(e)}"}


async def generate_stream(model, tokenizer, prompt: str, chat_input: ChatInput) -> AsyncIterable[str]:
    try:
        logger.debug("Starting streaming generation")
        inputs = tokenizer([prompt], return_tensors="pt")
        input_length = len(inputs.input_ids[0])
        
        # Default max tokens if not specified or too large
        max_tokens = min(chat_input.max_tokens, 300) if chat_input.max_tokens else 300
        logger.debug(f"Using max_tokens={max_tokens} for streaming generation")
        
        # Stream tokens one by one
        generated_ids = []
        token_count = 0
        
        # Common sentence-ending punctuation to help with stopping
        sentence_endings = [".", "!", "?", "\n\n"]
        recent_text = ""
        
        for i in range(max_tokens):
            # Get model outputs
            if len(generated_ids) == 0:
                outputs = model.generate(
                    **inputs,
                    do_sample=True,
                    temperature=chat_input.temperature,
                    max_new_tokens=1,
                    return_dict_in_generate=True,
                    output_scores=False
                )
                new_token = outputs.sequences[0, input_length:][0]
            else:
                # Continue from previous tokens
                current_inputs = torch.cat([inputs.input_ids[0], torch.tensor(generated_ids)]).unsqueeze(0)
                outputs = model.generate(
                    current_inputs,
                    do_sample=True,
                    temperature=chat_input.temperature,
                    max_new_tokens=1,
                    return_dict_in_generate=True,
                    output_scores=False
                )
                new_token = outputs.sequences[0, -1]
            
            # Append to generated ids
            generated_ids.append(new_token.item())
            token_count += 1
            
            # Decode the new token
            token_text = tokenizer.decode(new_token, skip_special_tokens=True)
            recent_text += token_text
            # Keep only the last 10 characters to check for ending
            if len(recent_text) > 10:
                recent_text = recent_text[-10:]
            
            # Create the SSE data format
            data = json.dumps({"token": token_text})
            event_data = f"data: {data}\n\n"
            
            yield event_data
            
            # Check stopping conditions
            
            # 1. Stop if we generated a special token
            if token_text.strip() == "" and len(generated_ids) > 1:
                # Check if it might be an end token
                full_text = tokenizer.decode(torch.tensor(generated_ids), skip_special_tokens=False)
                if any(token in full_text for token in tokenizer.all_special_tokens):
                    logger.debug("Stopping generation: special token detected")
                    break
            
            # 2. Stop if we've reached a good stopping point after at least 200 tokens
            if token_count >= 200:
                # Check if we've reached a sentence ending
                if any(recent_text.endswith(end) for end in sentence_endings):
                    logger.debug(f"Stopping generation: reached sentence ending after {token_count} tokens")
                    break
            
            # 3. Hard stop at max tokens
            if token_count >= max_tokens - 1:
                logger.debug(f"Stopping generation: reached max token limit of {max_tokens}")
                break
            
            # Small sleep to control the stream rate
            await asyncio.sleep(0.01)
        
        # Add a final period if the text doesn't end with punctuation
        if token_count > 0 and not any(recent_text.endswith(end) for end in sentence_endings):
            end_data = json.dumps({"token": "."})
            yield f"data: {end_data}\n\n"
            logger.debug("Adding final period to complete the response")
        
        # End the stream
        yield "data: [DONE]\n\n"
        logger.debug(f"Streaming generation completed after {token_count} tokens")
    except Exception as e:
        logger.error(f"Error in streaming generation: {str(e)}", exc_info=True)
        error_data = json.dumps({"error": str(e)})
        yield f"data: {error_data}\n\n"
        yield "data: [DONE]\n\n"
