from fastapi import APIRouter, Request
from schemas import PromptInput
from model import token_analyzer
from logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/")
def token_probs(prompt: PromptInput, request: Request):
    logger.info(f"Token probabilities request received with max_length={prompt.max_length}")
    logger.debug(f"Prompt text: {prompt.text[:50]}...")
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    if model is None:
        logger.error("Model not found")
        return {"status": 400, "message": "Model not found"}
    if tokenizer is None:
        logger.error("Tokenizer not found")
        return {"status": 400, "message": "Tokenizer not found"}

    try:
        # Update the token analyzer with the current model and tokenizer
        token_analyzer.set_model_tokenizer(model, tokenizer)
        
        # Get token probabilities
        response_data = token_analyzer.analyze_token_probabilities(
            prompt.text, 
            max_tokens=prompt.max_length,
            top_k=10
        )
        
        logger.info(f"Token probabilities calculated successfully for {len(response_data)} tokens")
        return {"status": 200, "token_probs": response_data}
    except Exception as e:
        logger.error(f"Error calculating token probabilities: {str(e)}", exc_info=True)
        return {"status": 500, "message": f"Error calculating token probabilities: {str(e)}"} 