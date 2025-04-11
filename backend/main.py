from typing import Union, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model.main import load_model
from attention.head_view import head_view
from pydantic import BaseModel
from model.token_probs import process_text_probabilities

class Prompt(BaseModel):
    prompt: str

class TokenProbRequest(BaseModel):
    text: str
    max_length: Optional[int] = 512

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/generate")
def generate(prompt: str):
    tokenizer, model = load_model()
    return generate_text(model, tokenizer, prompt)


@app.post("/head_view")
def post_head_view(prompt: Prompt):
    tokenizer, model = load_model()
    inputs = tokenizer.encode(prompt.prompt, return_tensors="pt")
    outputs = model(inputs)
    attention = outputs[-1]
    tokens = tokenizer.convert_ids_to_tokens(inputs[0])  # Convert input ids to token strings
    return head_view(attention, tokens)


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.post("/api/token-probabilities")
async def get_token_probabilities(request: TokenProbRequest) -> Dict:
    """
    Get token probabilities and alternatives for the input text
    """
    try:
        # Get the model and tokenizer
        model, tokenizer = load_model()
        
        # Prepare input
        inputs = tokenizer(
            request.text,
            return_tensors="pt",
            max_length=request.max_length,
            truncation=True
        )
        
        # Get model output with logits
        outputs = model(**inputs, output_attentions=False, output_hidden_states=False)
        
        # Process token probabilities
        token_info = process_text_probabilities(request.text, outputs, tokenizer)
        
        return token_info
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing token probabilities: {str(e)}"
        )
