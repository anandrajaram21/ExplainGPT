from fastapi import APIRouter, Request
from schemas import PlaygroundInput
from model import model_service
from logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/")
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
        # Update model and tokenizer in the service
        model_service.model = model
        model_service.tokenizer = tokenizer
        
        # Generate with parameters
        generated_texts = model_service.generate_with_params(
            prompt=config.text,
            temperature=config.temperature,
            top_k=config.top_k,
            top_p=config.top_p,
            max_length=config.max_length,
            num_return_sequences=config.num_return_sequences
        )
        
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