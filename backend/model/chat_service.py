import json
import asyncio
import torch
import torch.nn.functional as F
from typing import AsyncIterable, List, Dict
from logger import get_logger

logger = get_logger(__name__)

class ChatService:
    def __init__(self, model=None, tokenizer=None):
        self.model = model
        self.tokenizer = tokenizer
        
    def set_model_tokenizer(self, model, tokenizer):
        """Set or update the model and tokenizer"""
        self.model = model
        self.tokenizer = tokenizer
    
    async def generate_stream(self, prompt: str, temperature: float = 0.7, 
                             max_tokens: int = 300) -> AsyncIterable[str]:
        """Generate streaming chat response"""
        if not self.model or not self.tokenizer:
            raise ValueError("Model or tokenizer not initialized")
            
        try:
            logger.debug(f"Starting streaming generation with prompt: {prompt[:50]}...")
            
            # Get the model's context size
            context_size = getattr(self.model.config, "n_positions", 1024)
            logger.debug(f"Model context size: {context_size}")
            
            # Tokenize input
            input_ids = self.tokenizer.encode(prompt, return_tensors="pt")
            
            # Check if input is too long for model's context window
            if input_ids.size(1) > context_size - max_tokens:
                logger.warning(f"Input too long ({input_ids.size(1)} tokens), truncating to fit context window")
                # Keep the most recent tokens to fit within context, preserving some room for generation
                truncate_length = context_size - max_tokens - 50  # leave buffer
                input_ids = input_ids[:, -truncate_length:]
                logger.debug(f"Truncated input to {input_ids.size(1)} tokens")
            
            # Ensure proper length for attention mask
            attention_mask = torch.ones(input_ids.shape, dtype=torch.long)
            
            # Get vocabulary size
            vocab_size = self.tokenizer.vocab_size if hasattr(self.tokenizer, 'vocab_size') else len(self.tokenizer)
            logger.debug(f"Tokenizer vocabulary size: {vocab_size}")
            
            # Instead of token-by-token generation, use batched generation as it's more stable
            # but split it into smaller chunks
            chunk_size = 20  # Generate in small batches for streaming effect
            total_new_tokens = 0
            
            # Generate incrementally in chunks
            while total_new_tokens < max_tokens:
                try:
                    curr_chunk_size = min(chunk_size, max_tokens - total_new_tokens)
                    
                    # Generate a chunk of tokens
                    with torch.no_grad():
                        outputs = self.model.generate(
                            input_ids,
                            attention_mask=attention_mask,
                            max_new_tokens=curr_chunk_size,
                            do_sample=True,
                            temperature=temperature,
                            pad_token_id=self.tokenizer.eos_token_id,
                            eos_token_id=self.tokenizer.eos_token_id,
                            return_dict_in_generate=True,
                            output_scores=False
                        )
                        
                    # Get the new tokens (exclude the input)
                    new_tokens = outputs.sequences[0, input_ids.size(1):]
                    
                    # If no new tokens were generated, break
                    if len(new_tokens) == 0:
                        logger.debug("No new tokens generated, stopping")
                        break
                        
                    # Check for EOS token
                    eos_positions = (new_tokens == self.tokenizer.eos_token_id).nonzero()
                    if len(eos_positions) > 0:
                        # Only keep tokens up to the first EOS
                        new_tokens = new_tokens[:eos_positions[0].item()]
                        
                    # Stream the tokens one by one
                    for i, token_id in enumerate(new_tokens):
                        token_text = self.tokenizer.decode([token_id.item()], skip_special_tokens=True)
                        if token_text:  # Only yield if token isn't empty
                            yield json.dumps({"token": token_text})
                            # Small delay for streaming effect
                            await asyncio.sleep(0.01)
                            
                    # Update input_ids for next iteration
                    input_ids = outputs.sequences
                    attention_mask = torch.ones(input_ids.shape, dtype=torch.long)
                    
                    # Update total tokens generated
                    total_new_tokens += len(new_tokens)
                    
                    # Check if EOS was generated
                    if len(eos_positions) > 0:
                        logger.debug("EOS token generated, stopping")
                        break
                        
                    # If we've reached the context limit, stop
                    if input_ids.size(1) >= context_size - 10:  # leave small buffer
                        logger.warning("Approaching context limit, stopping generation")
                        break
                    
                except Exception as e:
                    logger.error(f"Error during token generation: {str(e)}", exc_info=True)
                    yield json.dumps({"error": f"Token generation error: {str(e)}"})
                    break
            
            logger.debug(f"Streaming generation completed with {total_new_tokens} tokens")
            
        except Exception as e:
            logger.error(f"Error in streaming setup: {str(e)}", exc_info=True)
            yield json.dumps({"error": str(e)})
    
    def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 300) -> str:
        """Generate complete text response (non-streaming)"""
        if not self.model or not self.tokenizer:
            raise ValueError("Model or tokenizer not initialized")
        
        try:
            logger.debug("Tokenizing input for non-streaming generation")
            input_ids = self.tokenizer.encode(prompt, return_tensors="pt")
            
            # Get the model's context size
            context_size = getattr(self.model.config, "n_positions", 1024)
            logger.debug(f"Model context size: {context_size}")
            
            # Check if input is too long for model's context window
            if input_ids.size(1) > context_size - max_tokens:
                logger.warning(f"Input too long ({input_ids.size(1)} tokens), truncating to fit context window")
                # Keep the most recent tokens to fit within context
                truncate_length = context_size - max_tokens - 20  # leave buffer
                input_ids = input_ids[:, -truncate_length:]
                logger.debug(f"Truncated input to {input_ids.size(1)} tokens")
            
            # Add extra safety parameter to prevent sampling issues
            logger.debug(f"Generating with temperature={temperature}, max_tokens={max_tokens}")
            outputs = self.model.generate(
                input_ids,
                do_sample=True,
                temperature=temperature,
                max_new_tokens=max_tokens,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
                output_hidden_states=False
            )
            
            logger.debug("Decoding generated text")
            generated_text = self.tokenizer.decode(outputs[0, input_ids.size(1):], skip_special_tokens=True)
            
            return generated_text
        except Exception as e:
            logger.error(f"Error in text generation: {str(e)}", exc_info=True)
            raise

# Create a singleton instance
chat_service = ChatService() 