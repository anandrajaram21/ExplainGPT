from transformers import AutoTokenizer, AutoModel
from bertviz import head_view
import streamlit as st

model_name = "distilbert/distilgpt2"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name, output_attentions=True)

def show_head_view(input_text):
    inputs = tokenizer.encode(input_text, return_tensors="pt")
    outputs = model(inputs)
    attention = outputs[-1]
    tokens = tokenizer.convert_ids_to_tokens(inputs[0])

    return head_view(attention, tokens, html_action='return').data

html_raw_data = show_head_view("The quick brown fox jumps over the lazy dog")

st.title("BERTViz Attention Head View")
st.components.v1.html(html_raw_data)