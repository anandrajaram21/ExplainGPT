from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from logger import get_logger

logger = get_logger(__name__)

def load_model(model_name: str = "distilbert/distilgpt2"):
    logger.info(f"Loading model: {model_name}")
    try:
        logger.debug(f"Initializing tokenizer for {model_name}")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        logger.debug(f"Initializing model for {model_name}")
        model = AutoModelForCausalLM.from_pretrained(
            model_name, output_attentions=True, return_dict_in_generate=True
        )
        
        logger.debug(f"Creating text generation pipeline for {model_name}")
        generator = pipeline("text-generation", model=model, tokenizer=tokenizer)
        
        logger.info(f"Successfully loaded model: {model_name}")
        return tokenizer, model, generator
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {str(e)}", exc_info=True)
        raise
