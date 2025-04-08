from transformers import AutoTokenizer, AutoModel, utils
from bertviz import head_view

model_name = "distilbert/distilgpt2"

tokenizer = AutoTokenizer.from_pretrained("gpt2")
model = AutoModel.from_pretrained("gpt2", output_attentions=True)

def show_head_view(input_text):
    inputs = tokenizer.encode(input_text, return_tensors="pt")
    outputs = model(inputs)
    attention = outputs[-1]
    tokens = tokenizer.convert_ids_to_tokens(inputs[0])

    return head_view(attention, tokens, html_action='return')

print(show_head_view("The quick brown fox jumps over the lazy dog."))