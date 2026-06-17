from pydantic import BaseModel, Field
from typing import Optional

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}

class TicketCreate(BaseModel):
    title: str
    description: str
    reporter_name: Optional[str] = Field(None, max_length=100)

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    ai_suggestion: Optional[str] = None
    reporter_name: Optional[str] = Field(None, max_length=100)

class Ticket(BaseModel):
    id: int
    title: str
    description: str
    status: str
    category: str = "uncategorized"
    priority: str = "medium"
    ai_suggestion: Optional[str] = None
    reporter_name: Optional[str] = None
    created_at: str
    updated_at: str

class TicketAnalysis(BaseModel):
    category: str
    priority: str
    suggestion: str
