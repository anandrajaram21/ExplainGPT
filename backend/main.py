from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from model import model_service
from logger import setup_logger, get_logger
from config import settings

# Set up logging
logger = setup_logger()
app_logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ExplainGPT API",
    description="API for generating and explaining text with language models",
    version="1.0.0",
    debug=settings.DEBUG
)

# Register routes
app.include_router(router, prefix=settings.API_PREFIX)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

@app.on_event("startup")
async def startup_event():
    app_logger.info("Application starting up")
    try:
        app_logger.info(f"Loading model: {settings.DEFAULT_MODEL}")
        tokenizer, model, pipeline = model_service.load_model(settings.DEFAULT_MODEL)
        app.state.model = model
        app.state.tokenizer = tokenizer
        app.state.pipeline = pipeline
        app_logger.info("Model loaded successfully")
    except Exception as e:
        app_logger.error(f"Error loading model: {str(e)}", exc_info=True)
        raise

@app.on_event("shutdown")
async def shutdown_event():
    app_logger.info("Application shutting down")

@app.get("/")
async def root():
    return {"status": "ok", "message": "ExplainGPT API is running"}
