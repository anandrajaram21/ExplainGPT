from pydantic import BaseModel


class PromptInput(BaseModel):
    text: str
    max_length: int = 50


class ModelNameInput(BaseModel):
    model_name: str
