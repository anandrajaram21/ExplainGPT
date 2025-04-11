from fastapi import FastAPI
from routes import router
from model.main import load_model

app = FastAPI()
app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    model, tokenizer = load_model("anandrajaram21/tinystories-test")
    app.state.model = model
    app.state.tokenizer = tokenizer