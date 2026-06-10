from pydantic import BaseModel
from typing import Optional

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}

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

class PriorityUpdate(BaseModel):
    priority: str
    changed_by: Optional[str] = "anonymous"

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

class ChangeLogEntry(BaseModel):
    id: int
    ticket_id: int
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str
    changed_at: str

class TicketAnalysis(BaseModel):
    category: str
    priority: str
    suggestion: str
