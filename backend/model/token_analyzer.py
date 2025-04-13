import torch
import numpy as np
from logger import get_logger
from typing import List, Dict, Any

logger = get_logger(__name__)

class TokenAnalyzer:
    def __init__(self, model=None, tokenizer=None):
        self.model = model
        self.tokenizer = tokenizer
        
    def set_model_tokenizer(self, model, tokenizer):
        """Set or update the model and tokenizer"""
        self.model = model
        self.tokenizer = tokenizer
        
    def analyze_token_probabilities(self, prompt: str, max_tokens: int = 50, top_k: int = 10) -> List[Dict[str, Any]]:
        """Analyze token probabilities for generated text"""
        if not self.model or not self.tokenizer:
            raise ValueError("Model or tokenizer not initialized")
            
        logger.debug("Tokenizing input")
        inputs = self.tokenizer([prompt], return_tensors="pt")
        
        logger.debug(f"Generating with max_new_tokens={max_tokens}")
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            return_dict_in_generate=True,
            output_scores=True,
            output_logits=True
        )
        
        logger.debug("Computing transition scores")
        transition_scores = self.model.compute_transition_scores(
            outputs.sequences, outputs.scores, normalize_logits=True
        )

        input_length = 1 if self.model.config.is_encoder_decoder else inputs.input_ids.shape[1]
        generated_tokens = outputs.sequences[:, input_length:]

        logger.debug(f"Processing {len(generated_tokens[0])} generated tokens")
        response_data = []
        
        for i, (token_id, score, logits) in enumerate(
            zip(generated_tokens[0], transition_scores[0], outputs.scores)
        ):
            logits = logits[0]  # remove batch dimension
            probs = torch.nn.functional.softmax(logits, dim=-1)
            sorted_probs, sorted_indices = torch.sort(probs, descending=True)

            step_data = {
                "step": i + 1,
                "generated_token": {
                    "id": token_id.item(),
                    "text": self.tokenizer.decode(token_id),
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
                        "text": self.tokenizer.decode([tok_id]),
                        "probability": float(prob),
                        "selected": tok_id == token_id.item(),
                    }
                )

            response_data.append(step_data)
            
        return response_data

# Create a singleton instance
token_analyzer = TokenAnalyzer() 