from fastapi import APIRouter, Request
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import numpy as np
from schemas import PromptInput, ModelNameInput
from model.main import load_model
from logger import get_logger

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
