from fastapi import APIRouter, Request
from schemas import ModelNameInput, PromptInput
from model import model_service
from logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/change_model")
def change_model(model_name: ModelNameInput, request: Request):
    logger.info(f"Changing model to: {model_name.model_name}")
    try:
        tokenizer, model, pipeline = model_service.load_model(model_name.model_name)
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
    logger.debug(f"Prompt text: {prompt.text[:50]}...")
    
    pipeline = request.app.state.pipeline
    if pipeline is None:
        logger.error("Pipeline not found")
        return {"status": 400, "message": "Pipeline not found"}

    try:
        logger.debug("Starting text generation")
        output = model_service.generate_text(prompt.text, max_length=prompt.max_length)
        output_text = output[0]["generated_text"]
        logger.debug(f"Generation completed, output length: {len(output_text)}")
        logger.debug(f"Output (first 50 chars): {output_text[:50]}...")
        
        return {"status": 200, "output": output_text}
    except Exception as e:
        logger.error(f"Error in text generation: {str(e)}", exc_info=True)
        return {"status": 500, "message": f"Error generating text: {str(e)}"} 