from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
from logger import get_logger

logger = get_logger(__name__)

class ModelService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        
    def load_model(self, model_name: str):
        """Load a model from HuggingFace by name"""
        logger.info(f"Loading model: {model_name}")
        try:
            logger.debug(f"Initializing tokenizer for {model_name}")
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            
            logger.debug(f"Initializing model for {model_name}")
            model = AutoModelForCausalLM.from_pretrained(
                model_name, output_attentions=True, return_dict_in_generate=True
            )
            
            logger.debug(f"Creating text generation pipeline for {model_name}")
            generator = pipeline(
                "text-generation", 
                model=model, 
                tokenizer=tokenizer, 
                device=0 if torch.cuda.is_available() else -1
            )
            
            self.model = model
            self.tokenizer = tokenizer
            self.pipeline = generator
            
            logger.info(f"Successfully loaded model: {model_name}")
            return tokenizer, model, generator
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}", exc_info=True)
            raise
    
    def generate_text(self, prompt: str, max_length: int = 50):
        """Generate text using the loaded pipeline"""
        if not self.pipeline:
            raise ValueError("Model pipeline not initialized")
        
        return self.pipeline(prompt, max_length=max_length, num_return_sequences=1)
        
    def generate_with_params(self, prompt: str, temperature: float = 0.7, 
                            top_k: int = 50, top_p: float = 0.9, 
                            max_length: int = 100, num_return_sequences: int = 1):
        """Generate text with specific parameters"""
        if not self.model or not self.tokenizer:
            raise ValueError("Model or tokenizer not initialized")
            
        inputs = self.tokenizer([prompt], return_tensors="pt")
        
        outputs = self.model.generate(
            **inputs,
            do_sample=True,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            max_new_tokens=max_length,
            num_return_sequences=num_return_sequences,
            return_dict_in_generate=True
        )
        
        input_length = 1 if self.model.config.is_encoder_decoder else inputs.input_ids.shape[1]
        generated_sequences = outputs.sequences[:, input_length:]
        
        generated_texts = []
        for seq in generated_sequences:
            generated_text = self.tokenizer.decode(seq, skip_special_tokens=True)
            generated_texts.append(generated_text)
            
        return generated_texts
        
    def get_attention_weights(self, text: str):
        """Extract attention weights from the model for visualization"""
        if not self.model or not self.tokenizer:
            raise ValueError("Model or tokenizer not initialized")
            
        # Tokenize the input text
        inputs = self.tokenizer(text, return_tensors="pt")
        
        # Run the model and get attention weights
        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)
        
        # Get the tokens
        tokens = self.tokenizer.convert_ids_to_tokens(inputs.input_ids[0])
        
        # Debug attention weights
        logger.info(f"Attention shape: {len(outputs.attentions)} layers")
        
        # Get model information for logging
        model_name = getattr(self.model.config, '_name_or_path', 'unknown')
        logger.info(f"Processing model: {model_name}")
        
        # Process each layer of attention weights
        normalized_weights = []
        
        for layer_idx, layer_tensor in enumerate(outputs.attentions):
            # Get the actual shape of this layer's attention tensor
            logger.info(f"Layer {layer_idx} attention tensor shape: {layer_tensor.shape}")
            
            # Handle different model architectures based on shape
            if len(layer_tensor.shape) == 4:  # [batch, heads, seq, seq]
                # Most common case - remove batch dimension (should be 1)
                layer_tensor = layer_tensor.squeeze(0)
                num_heads_in_layer = layer_tensor.shape[0]
            elif len(layer_tensor.shape) == 3:  # [heads, seq, seq] or [batch, seq, seq]
                # Could be either heads already extracted or a single head model
                # Determine based on model config if possible
                if hasattr(self.model.config, 'num_attention_heads'):
                    expected_heads = self.model.config.num_attention_heads
                    seq_len = layer_tensor.shape[-1]
                    
                    # If first dimension matches expected heads, it's already correct
                    if layer_tensor.shape[0] == expected_heads:
                        num_heads_in_layer = expected_heads
                    else:
                        # Try to reshape to expected number of heads
                        try:
                            layer_tensor = layer_tensor.view(expected_heads, seq_len, seq_len)
                            num_heads_in_layer = expected_heads
                            logger.info(f"Reshaped to {layer_tensor.shape} based on model config")
                        except Exception as e:
                            logger.warning(f"Couldn't reshape using config num_heads: {e}")
                            # Assume it's just one head
                            layer_tensor = layer_tensor.unsqueeze(0) if len(layer_tensor.shape) < 3 else layer_tensor
                            num_heads_in_layer = 1
                else:
                    # No config info available, make best guess
                    logger.warning("No num_attention_heads in config, using best guess from shape")
                    layer_tensor = layer_tensor.unsqueeze(0) if len(layer_tensor.shape) < 3 else layer_tensor
                    num_heads_in_layer = layer_tensor.shape[0]
            else:
                # Unexpected shape, try to adapt
                logger.warning(f"Unexpected attention tensor shape: {layer_tensor.shape}")
                if len(layer_tensor.shape) == 2:  # [seq, seq]
                    # Single attention matrix, add head dimension
                    layer_tensor = layer_tensor.unsqueeze(0)
                    num_heads_in_layer = 1
                else:
                    raise ValueError(f"Unsupported attention tensor shape: {layer_tensor.shape}")
            
            logger.info(f"Layer {layer_idx} has {num_heads_in_layer} heads")
            
            # Process all heads for this layer
            layer_heads = []
            for head_idx in range(num_heads_in_layer):
                # Extract and normalize this head's attention weights
                head_data = layer_tensor[head_idx]
                
                # Apply softmax to normalize (if not already done by the model)
                head_softmax = torch.nn.functional.softmax(head_data * 10, dim=-1)
                
                # Convert to list
                head_weights = head_softmax.cpu().numpy().tolist()
                layer_heads.append(head_weights)
            
            # Add all heads for this layer
            normalized_weights.append(layer_heads)
            
            # Log stats for verification
            logger.info(f"Layer {layer_idx}: processed {len(layer_heads)} heads")
            if len(layer_heads) > 0:
                logger.info(f"  First head shape: {len(layer_heads[0])}x{len(layer_heads[0][0]) if len(layer_heads[0]) > 0 else 0}")
        
        # Get number of heads from the first layer or model config
        if hasattr(self.model.config, 'num_attention_heads'):
            num_heads = self.model.config.num_attention_heads
            logger.info(f"Using num_attention_heads from model config: {num_heads}")
        else:
            # Get number of heads from the processed data
            num_heads = len(normalized_weights[0]) if normalized_weights and len(normalized_weights) > 0 else 0
            logger.info(f"Determined num_heads from data: {num_heads}")
        
        # Prepare the result
        result = {
            "tokens": tokens,
            "attention": normalized_weights,
            "num_layers": len(normalized_weights),
            "num_heads": num_heads,
            "seq_len": len(tokens)
        }
        
        logger.info(f"Result structure - layers: {result['num_layers']}, heads: {result['num_heads']}")
        
        return result

# Create a singleton instance
model_service = ModelService() 