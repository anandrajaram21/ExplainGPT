from fastapi import APIRouter
from .model_routes import router as model_router
from .token_routes import router as token_router
from .playground_routes import router as playground_router
from .chat_routes import router as chat_router
from .attention_routes import router as attention_router

router = APIRouter()

# Include all route modules with appropriate prefixes
router.include_router(model_router, prefix="/model")
router.include_router(token_router, prefix="/token_probs")
router.include_router(playground_router, prefix="/playground")
router.include_router(chat_router, prefix="/chat")
router.include_router(attention_router, prefix="/attention")

__all__ = ['router'] 