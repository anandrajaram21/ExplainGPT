from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline


def load_model(model_name: str = "distilbert/distilgpt2"):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, output_attentions=True, return_dict_in_generate=True
    )
    generator = pipeline("text-generation", model=model, tokenizer=tokenizer)
    return tokenizer, model, generator
