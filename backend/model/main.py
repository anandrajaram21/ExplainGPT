from transformers import AutoTokenizer, AutoModelForCausalLM


def load_model(model_name: str = "distilbert/distilgpt2"):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name, output_attentions=True)
    return tokenizer, model


def generate_text(model, tokenizer, prompt: str, max_length: int = 100):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=max_length)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
