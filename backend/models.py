from pydantic import BaseModel, Field
from typing import Optional

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
VALID_AUTHORS = {"Mitarbeiter", "IT-Admin"}

class TicketCreate(BaseModel):
    title: str
    description: str

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    ai_suggestion: Optional[str] = None

class Ticket(BaseModel):
    id: int
    title: str
    description: str
    status: str
    category: str = "uncategorized"
    priority: str = "medium"
    ai_suggestion: Optional[str] = None
    created_at: str
    updated_at: str

class TicketAnalysis(BaseModel):
    category: str
    priority: str
    suggestion: str

# ── Kommentar-Modelle ────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)
    author: str = Field(default="Mitarbeiter")

class Comment(BaseModel):
    id: int
    ticket_id: int
    author: str
    body: str
    created_at: str
