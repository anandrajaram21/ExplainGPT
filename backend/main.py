from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.main import router
from model.main import load_model
from logger import setup_logger, get_logger

# Set up logging
logger = setup_logger()
app_logger = get_logger(__name__)

app = FastAPI()
app.include_router(router)

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    app_logger.info("Application starting up")
    try:
        app_logger.info("Loading model: anandrajaram21/tinystories-test")
        tokenizer, model, pipeline = load_model("anandrajaram21/tinystories-test")
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
