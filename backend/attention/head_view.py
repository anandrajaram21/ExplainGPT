import json
import os
import uuid

from .utils import format_special_chars, format_attention, num_layers


def head_view(attention, tokens):
    attn_data = []

    include_layers = list(range(num_layers(attention)))
    attention = format_attention(attention, include_layers)

    attn_data.append(
        {
            "name": None,
            "attn": attention.tolist(),
            "left_text": tokens,
            "right_text": tokens,
        }
    )

    vis_id = "bertviz-%s" % (uuid.uuid4().hex)

    for d in attn_data:
        attn_seq_len_left = len(d["attn"][0][0])
        if attn_seq_len_left != len(d["left_text"]):
            raise ValueError(
                f"Attention has {attn_seq_len_left} positions, while number of tokens is {len(d['left_text'])} "
                f"for tokens: {' '.join(d['left_text'])}"
            )
        attn_seq_len_right = len(d["attn"][0][0][0])
        if attn_seq_len_right != len(d["right_text"]):
            raise ValueError(
                f"Attention has {attn_seq_len_right} positions, while number of tokens is {len(d['right_text'])} "
                f"for tokens: {' '.join(d['right_text'])}"
            )
        d["left_text"] = format_special_chars(d["left_text"])
        d["right_text"] = format_special_chars(d["right_text"])

    params = {
        "attention": attn_data,
        "default_filter": "0",
        "root_div_id": vis_id,
        "layer": None,
        "heads": None,
        "include_layers": include_layers,
    }

    return params
