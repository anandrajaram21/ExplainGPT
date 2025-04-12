from transformers import AutoTokenizer, AutoModelForCausalLM


def load_model(model_name: str = "distilbert/distilgpt2"):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, output_attentions=True, return_dict_in_generate=True
    )
    return tokenizer, model
