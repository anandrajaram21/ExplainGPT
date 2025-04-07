# This training script was run on kaggle to produce better results
from transformers import GPT2Config, GPT2LMHeadModel, AutoTokenizer, Trainer, TrainingArguments, TextStreamer
from datasets import load_dataset
import torch
import wandb

"""
Training script for a small GPT-2 model on the TinyStories dataset.
This script trains a custom GPT-2 model with reduced parameters for efficient training on consumer hardware.
The model is trained on the TinyStories dataset to generate simple, coherent stories.
"""

# Model Configuration
config = GPT2Config(
    vocab_size=50257,  # Standard GPT-2 vocabulary size
    n_positions=512,   # Maximum sequence length
    n_embd=64,        # Embedding dimension (reduced from original GPT-2)
    n_layer=2,        # Number of transformer layers (reduced for faster training)
    n_head=2,         # Number of attention heads
    n_inner=64,       # Dimension of feed-forward layer
    resid_pdrop=0.1,  # Dropout rate for residual layers
    embd_pdrop=0.1,   # Dropout rate for embeddings
    attn_pdrop=0.1,   # Dropout rate for attention
)

# Initialize model and print parameter count
custom_gpt2_model = GPT2LMHeadModel(config)
print(f"Number of parameters: {sum(p.numel() for p in custom_gpt2_model.parameters())}")

# Initialize tokenizer and add padding token
tokenizer = AutoTokenizer.from_pretrained("gpt2")
tokenizer.add_special_tokens({'pad_token': '[PAD]'})
custom_gpt2_model.resize_token_embeddings(len(tokenizer))

# Load and prepare the TinyStories dataset
dataset = load_dataset("roneneldan/TinyStories")

def tokenize_function(examples):
    """
    Tokenize the input text and prepare it for training.
    
    Args:
        examples: Dictionary containing the text data
        
    Returns:
        Dictionary with tokenized inputs and labels for causal language modeling
    """
    tokenized_output = tokenizer(
        examples['text'],
        truncation=True,
        padding="max_length",
        max_length=128,  # Limit sequence length for efficiency
    )
    # For causal language modeling, labels are the same as input_ids
    tokenized_output['labels'] = tokenized_output['input_ids'].copy()
    return tokenized_output

# Process the dataset
tokenized_datasets = dataset.map(tokenize_function, batched=True, remove_columns=["text"])

# Prepare train and evaluation datasets
train_dataset = tokenized_datasets['train'].shuffle(seed=42)
eval_dataset = tokenized_datasets['validation'].shuffle(seed=42)

# Configure training parameters
training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=8,   # Batch size per GPU/CPU for training
    per_device_eval_batch_size=8,    # Batch size for evaluation
    num_train_epochs=4,              # Total number of training epochs
    logging_dir="./logs",          # Directory for storing logs
    logging_steps=100,               # Log every X steps
    save_steps=500,                  # Save checkpoint every X steps
    eval_strategy="steps",         # When to run evaluation
    eval_steps=500,                  # Evaluate every X steps
    save_total_limit=2,             # Limit the total amount of checkpoints
    report_to="wandb",            # Use Weights & Biases for logging
    fp16=True,                      # Enable mixed precision training for efficiency
)

# Initialize trainer
trainer = Trainer(
    model=custom_gpt2_model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    processing_class=tokenizer,
)

# Start training
trainer.train()

# Save the trained model and tokenizer
custom_gpt2_model.save_pretrained("./custom-gpt2-tinystories")
tokenizer.save_pretrained("./custom-gpt2-tinystories")

# Evaluate the model
eval_results = trainer.evaluate()
print(f"Evaluation Loss: {eval_results['eval_loss']}")
print(f"Perplexity: {torch.exp(torch.tensor(eval_results['eval_loss']))}")

def generate_streaming_output(model, tokenizer, prompt, max_length=100, temperature=0.7, top_k=50, top_p=0.95):
    """
    Generate text from the model with streaming output.
    
    Args:
        model: The trained GPT-2 model
        tokenizer: The tokenizer for text processing
        prompt: Initial text to start generation
        max_length: Maximum length of generated sequence
        temperature: Controls randomness in generation (higher = more random)
        top_k: Number of highest probability tokens to consider
        top_p: Cumulative probability threshold for token sampling
        
    Returns:
        str: The complete generated text
    """
    model.eval()
    input_ids = tokenizer.encode(prompt, return_tensors="pt").to(model.device)
    streamer = TextStreamer(tokenizer, skip_prompt=True)

    with torch.no_grad():
        output = model.generate(
            input_ids,
            max_length=max_length,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            do_sample=True,
            streamer=streamer,
        )

    return tokenizer.decode(output[0], skip_special_tokens=True)

# Example usage of text generation
prompt = "Once upon a time"
generated_text = generate_streaming_output(custom_gpt2_model, tokenizer, prompt)
print("\nFull Generated Text:")
print(generated_text)
