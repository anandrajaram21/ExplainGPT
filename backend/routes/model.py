from fastapi import APIRouter, Request
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import numpy as np
from schemas import PromptInput, ModelNameInput
from model.main import load_model

router = APIRouter()


@router.post("/change_model")
def change_model(model_name: ModelNameInput, request: Request):
    tokenizer, model = load_model(model_name.model_name)
    request.app.state.model = model
    request.app.state.tokenizer = tokenizer

    return {"status": 200, "message": "Changed successfully"}


@router.post("/generate")
def generate(prompt: PromptInput, request: Request):
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    print(model)
    print(tokenizer)

    if model is None:
        return {"status": 400, "message": "Model not found"}
    if tokenizer is None:
        return {"status": 400, "message": "Tokenizer not found"}

    input_ids = tokenizer.encode(prompt.text, return_tensors="pt")
    output = model.generate(input_ids, max_length=100, num_return_sequences=1)
    return {
        "status": 200,
        "output": tokenizer.decode(output[0], skip_special_tokens=True),
    }


@router.post("/token_probs")
def token_probs(prompt: PromptInput, request: Request):
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    input_prompt = prompt.text

    if model is None:
        return {"status": 400, "message": "Model not found"}
    if tokenizer is None:
        return {"status": 400, "message": "Tokenizer not found"}

    inputs = tokenizer([input_prompt], return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_new_tokens=5,
        return_dict_in_generate=True,
        output_scores=True,
        output_logits=True
    )
    transition_scores = model.compute_transition_scores(
        outputs.sequences, outputs.scores, normalize_logits=True
    )

    input_length = 1 if model.config.is_encoder_decoder else inputs.input_ids.shape[1]
    generated_tokens = outputs.sequences[:, input_length:]

    response_data = []
    for i, (token_id, score, logits) in enumerate(
        zip(generated_tokens[0], transition_scores[0], outputs.scores)
    ):
        logits = logits[0]  # remove batch dimension
        probs = torch.nn.functional.softmax(logits, dim=-1)
        sorted_probs, sorted_indices = torch.sort(probs, descending=True)

        top_k = 10
        step_data = {
            "step": i + 1,
            "generated_token": {
                "id": token_id.item(),
                "text": tokenizer.decode(token_id),
                "score": float(score.numpy()),
                "probability": float(np.exp(score.numpy())),
            },
            "top_alternatives": [],
        }

        for idx in range(top_k):
            tok_id = sorted_indices[idx].item()
            prob = sorted_probs[idx].item()
            step_data["top_alternatives"].append(
                {
                    "id": tok_id,
                    "text": tokenizer.decode([tok_id]),
                    "probability": float(prob),
                    "selected": tok_id == token_id.item(),
                }
            )

        response_data.append(step_data)

    return {"status": 200, "token_probs": response_data}
