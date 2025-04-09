from typing import Union
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model.main import load_model
from attention_visualization.head_view import format_attention, num_layers

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/attention")
def attention(prompt: str):
    tokenizer, model = load_model()
    inputs = tokenizer.encode(prompt, return_tensors="pt")
    outputs = model(inputs)
    attention = outputs[-1]  # Retrieve attention from model outputs
    tokens = tokenizer.convert_ids_to_tokens(inputs[0])  # Convert input id
    
    # Format attention data for frontend
    include_layers = list(range(num_layers(attention)))
    attention = format_attention(attention, include_layers)
    
    return {
        "attention": attention.tolist(),
        "left_text": tokens,
        "right_text": tokens
    }

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}