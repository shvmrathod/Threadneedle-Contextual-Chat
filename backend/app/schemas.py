"""Pydantic request/response models for the chat API."""
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class Role(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class Message(BaseModel):
    role: Role
    content: str


class ChatMode(str, Enum):
    normal = "normal"
    reply = "reply"     # user is replying to a specific block
    explain = "explain" # user clicked "Explain" on a block


class ChatRequest(BaseModel):
    messages: List[Message] = Field(
        default_factory=list,
        description="Full prior conversation. Backend is stateless.",
    )
    user_input: str = Field(
        "",
        description="The new user message. May be empty for 'explain' mode.",
    )
    selected_text: Optional[str] = Field(
        None,
        description="The block the user is replying to / asking to explain.",
    )
    mode: ChatMode = ChatMode.normal


class ChatResponse(BaseModel):
    reply: str
    model: str
