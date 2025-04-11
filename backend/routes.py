from fastapi import APIRouter, Request
from schemas import PromptInput, ModelNameInput
from model.main import load_model

router = APIRouter()

@router.post("/attention")
async def attention(prompt: PromptInput):
    return {"attention": prompt.text}

@router.post("/change_model")
async def change_model(model_name: ModelNameInput, request: Request):
    model, tokenizer = load_model(model_name.model_name)
    request.app.state.model = model
    request.app.state.tokenizer = tokenizer

    return {
        "status": 200,
        "message": "Changed successfully"
    }