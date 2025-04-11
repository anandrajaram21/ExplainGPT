from typing import List, Dict, TypedDict
import numpy as np
import torch
import torch.nn.functional as F
from transformers import PreTrainedTokenizer

class TokenAlternative(TypedDict):
    token: str
    probability: float

class TokenInfo(TypedDict):
    token: str
    probability: float
    alternatives: List[TokenAlternative]
    confidence_color: str

def get_confidence_color(probability: float) -> str:
    """
    Returns a color based on the token probability/confidence
    """
    if probability >= 0.8:
        return "#28a745"  # High confidence - Green
    elif probability >= 0.5:
        return "#ffc107"  # Medium confidence - Yellow
    else:
        return "#dc3545"  # Low confidence - Red

def get_token_probabilities(
    logits: torch.Tensor,
    tokenizer: PreTrainedTokenizer,
    top_k: int = 5
) -> tuple[List[float], List[List[TokenAlternative]]]:
    """
    Calculate token probabilities and alternatives from model logits
    
    Args:
        logits: Model output logits (batch_size, sequence_length, vocab_size)
        tokenizer: HuggingFace tokenizer
        top_k: Number of alternative tokens to return
        
    Returns:
        Tuple of (token_probabilities, token_alternatives)
    """
    # Apply softmax to get probabilities
    probs = F.softmax(logits, dim=-1)
    
    # Get the probability of the most likely token for each position
    token_probs = torch.max(probs, dim=-1).values
    
    # Get top-k alternative tokens for each position
    top_k_values, top_k_indices = torch.topk(probs, k=top_k, dim=-1)
    
    token_alternatives = []
    for pos in range(probs.shape[1]):
        pos_alternatives = []
        for k in range(top_k):
            alt_token = tokenizer.decode([top_k_indices[0, pos, k]])
            alt_prob = float(top_k_values[0, pos, k])
            pos_alternatives.append(TokenAlternative(
                token=alt_token,
                probability=alt_prob
            ))
        token_alternatives.append(pos_alternatives)
    
    return token_probs[0].tolist(), token_alternatives

def format_token_probabilities(
    tokens: List[str],
    probabilities: List[float],
    alternatives: List[List[TokenAlternative]]
) -> List[TokenInfo]:
    """
    Formats token probabilities and alternatives for frontend display
    """
    result = []
    
    for token, prob, alts in zip(tokens, probabilities, alternatives):
        token_info = TokenInfo(
            token=token,
            probability=float(prob),
            alternatives=alts,
            confidence_color=get_confidence_color(prob)
        )
        result.append(token_info)
    
    return result

def process_text_probabilities(text: str, model_output: Dict, tokenizer: PreTrainedTokenizer) -> Dict:
    """
    Process model outputs and return frontend-friendly format
    
    Args:
        text: Input text
        model_output: Raw model output containing logits
        tokenizer: HuggingFace tokenizer
        
    Returns:
        Dict containing processed token information for frontend display
    """
    # Get logits from model output
    logits = model_output["logits"]
    
    # Get token probabilities and alternatives
    token_probs, token_alternatives = get_token_probabilities(logits, tokenizer)
    
    # Get the actual tokens
    tokens = tokenizer.convert_ids_to_tokens(
        tokenizer(text, return_tensors="pt")["input_ids"][0]
    )
    tokens = [tokenizer.decode([tokenizer.convert_tokens_to_ids(token)]) for token in tokens]
    
    # Format the results
    formatted_tokens = format_token_probabilities(tokens, token_probs, token_alternatives)
    
    return {
        "text": text,
        "tokens": formatted_tokens
    }
