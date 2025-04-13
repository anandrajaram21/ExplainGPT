from pydantic import BaseModel, Field
from typing import List, Optional


class PromptInput(BaseModel):
    text: str
    max_length: int = 50


class ModelNameInput(BaseModel):
    model_name: str


class PlaygroundInput(BaseModel):
    text: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_k: int = Field(default=50, ge=1, le=100)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_length: int = Field(default=100, ge=1, le=1000)
    num_return_sequences: int = Field(default=1, ge=1, le=5)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatInput(BaseModel):
    messages: List[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=300, ge=1, le=1000)
    stream: bool = Field(default=True)
