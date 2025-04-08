from transformers import GPT2Model, GPT2Tokenizer

def load_model(model_name="anandrajaram21/tinystories-test"):
    """Load the model and tokenizer from Hugging Face."""
    try:
        print(f"Loading model and tokenizer from {model_name}...")
        tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        model = GPT2Model.from_pretrained("gpt2")
        print(f"Model loaded successfully and placed on {model.device}")
        return model, tokenizer
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        raise

def generate_text(model, tokenizer, prompt, max_length=100, temperature=0.7):
    """Generate text using the loaded model."""
    try:
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(
            **inputs,
            max_length=max_length,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception as e:
        print(f"Error generating text: {str(e)}")
        raise

def main():
    # Load the model and tokenizer
    model, tokenizer = load_model()
    
    # Test prompts
    test_prompts = [
        "Once upon a time,",
        "In a magical forest,",
        "The little robot"
    ]
    
    # Generate text for each prompt
    print("\nGenerating sample texts...\n")
    for prompt in test_prompts:
        print(f"Prompt: {prompt}")
        generated_text = generate_text(model, tokenizer, prompt)
        print(f"Generated text: {generated_text}\n")

if __name__ == "__main__":
    main()