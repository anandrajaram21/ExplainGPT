"""
Text generation script for trained TinyGPT model.
Provides interactive story generation with adjustable parameters.
"""

import os
import time
import torch
import tiktoken
from model.gpt import GPT
from config.train_tinystories import TrainingConfig
from utils.logger import setup_logger

logger = setup_logger(__name__)

def load_model(checkpoint_path):
    """Load a trained model from checkpoint."""
    logger.info(f"Loading model from {checkpoint_path}")
    config = TrainingConfig()
    model = GPT(config)
    model.load_state_dict(torch.load(checkpoint_path))
    model.to(config.device)
    model.eval()
    logger.info(f"Model loaded successfully to {config.device}")
    return model

def encode_prompt(prompt):
    """Encode text prompt to token IDs."""
    enc = tiktoken.get_encoding("gpt2")
    return torch.tensor(enc.encode(prompt), dtype=torch.long).unsqueeze(0)

def decode_tokens(token_ids):
    """
    Decode token IDs back to text.
    
    Args:
        token_ids: Tensor of token IDs
        
    Returns:
        str: Decoded text
    """
    enc = tiktoken.get_encoding("gpt2")
    # Convert tensor to list before decoding
    return enc.decode(token_ids.tolist())

def generate_story(prompt, model, max_tokens=200, temperature=0.9, top_k=None, top_p=0.9):
    """
    Generate a story continuation from a prompt.
    
    Args:
        prompt: Input text prompt
        model: Trained GPT model
        max_tokens: Maximum number of tokens to generate
        temperature: Sampling temperature (higher = more random)
        top_k: Number of top tokens to sample from (None = disabled)
        top_p: Cumulative probability threshold for nucleus sampling
    
    Returns:
        str: Generated story text
    """
    logger.debug(
        f"Generating with params - temp: {temperature}, "
        f"top_k: {top_k}, top_p: {top_p}, max_tokens: {max_tokens}"
    )
    
    # Generate text
    prompt_ids = encode_prompt(prompt)
    prompt_ids = prompt_ids.to(model.config.device)
    
    t0 = time.time()
    with torch.no_grad():
        generated_ids = model.generate(
            prompt_ids, 
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p
        )
    
    generated_text = decode_tokens(generated_ids[0])  # Take first batch item
    generation_time = time.time() - t0
    
    logger.debug(
        f"Generation completed in {generation_time:.2f}s "
        f"({max_tokens/generation_time:.1f} tokens/sec)"
    )
    
    return generated_text

def main():
    # Load model
    model_path = 'best_model.pt'
    if not os.path.exists(model_path):
        logger.error(f"No model checkpoint found at {model_path}")
        return
    
    model = load_model(model_path)
    
    # Interactive generation loop
    logger.info("\nEnter your prompts (type 'quit' to exit):")
    while True:
        prompt = input("\nPrompt: ").strip()
        if prompt.lower() == 'quit':
            break
        
        try:
            # Generate with different parameters
            logger.info("\nGenerating story with high temperature (more creative)...")
            story1 = generate_story(prompt, model, temperature=0.9, top_p=0.9)
            print("\nGenerated Story (Higher Temperature):")
            print("-" * 50)
            print(story1)
            
            logger.info("\nGenerating story with low temperature (more focused)...")
            story2 = generate_story(prompt, model, temperature=0.7, top_k=40)
            print("\nGenerated Story (Lower Temperature):")
            print("-" * 50)
            print(story2)
            
        except Exception as e:
            logger.error(f"Error generating story: {str(e)}")

if __name__ == '__main__':
    main()
