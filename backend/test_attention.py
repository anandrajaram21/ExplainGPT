import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

def test_attention_structure():
    """Test script to verify attention structure in distilgpt2"""
    print("Loading distilgpt2...")
    tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
    model = AutoModelForCausalLM.from_pretrained("distilgpt2", output_attentions=True)
    
    # Test input
    text = "Once upon a time"
    print(f"Processing text: '{text}'")
    
    # Tokenize
    inputs = tokenizer(text, return_tensors="pt")
    tokens = tokenizer.convert_ids_to_tokens(inputs.input_ids[0])
    print(f"Tokens: {tokens}")
    
    # Run model
    with torch.no_grad():
        outputs = model(**inputs, output_attentions=True)
    
    # Get attention weights
    attentions = outputs.attentions
    
    # Print attention shape information
    print(f"Number of attention layers: {len(attentions)}")
    
    for i, layer_attention in enumerate(attentions):
        print(f"Layer {i} attention shape: {layer_attention.shape}")
        
        # For first layer, show more details
        if i == 0:
            # Number of heads
            if len(layer_attention.shape) >= 2:
                num_heads = layer_attention.shape[1] if layer_attention.shape[0] == 1 else layer_attention.shape[0]
                print(f"Number of attention heads: {num_heads}")
            
            # Sample attention weights
            if len(layer_attention.shape) == 4:  # [batch, heads, seq_len, seq_len]
                # Show first head, first token attention
                first_head = layer_attention[0, 0] if layer_attention.shape[0] == 1 else layer_attention[0]
                print(f"First head shape: {first_head.shape}")
                print(f"First token attention: {first_head[0]}")
            elif len(layer_attention.shape) == 3:  # [batch, seq_len, seq_len] or [heads, seq_len, seq_len]
                print(f"First row attention: {layer_attention[0, 0]}")

if __name__ == "__main__":
    test_attention_structure() 