from fastapi import APIRouter, Request, HTTPException
from schemas import AttentionInput, AttentionResponse
from logger import get_logger
from model.model_service import model_service
router = APIRouter()
logger = get_logger(__name__)

@router.post("/", response_model=AttentionResponse)
async def get_attention_weights(request: Request, input_data: AttentionInput):
    """
    Analyze the attention weights for a given input text.
    
    This endpoint returns the attention weights for each layer and head in the model.
    These weights can be visualized to show the relationships between tokens.
    """
    try:
        # Get model from application state
        model = request.app.state.model
        tokenizer = request.app.state.tokenizer
        
        if not model or not tokenizer:
            logger.error("Model or tokenizer not initialized")
            raise HTTPException(status_code=500, detail="Model not initialized")
        
        # Import model service to use the attention weights function
        
        # Set the model and tokenizer if not already set
        if not model_service.model or not model_service.tokenizer:
            model_service.set_model_tokenizer(model, tokenizer)
        
        # Get attention weights
        logger.info(f"Getting attention weights for input text: {input_data.text[:50]}...")
        result = model_service.get_attention_weights(input_data.text)
        
        return result
    except Exception as e:
        logger.error(f"Error getting attention weights: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting attention weights: {str(e)}") 