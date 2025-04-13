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

# Create a singleton instance
model_service = ModelService() 