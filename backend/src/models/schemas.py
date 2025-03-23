from typing import List

from pydantic import BaseModel


class HealthResponse(BaseModel):
    message: str
    status: int


class ChatHistory(BaseModel):
    query: str
    response: str


class AgentChatRequest(BaseModel):
    query: str
    chat_history: List[ChatHistory] = []
    user_id: str


class AgentChatResponse(BaseModel):
    type: str
    content: str
