from pydantic import BaseModel, field_validator
from typing import Optional

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}

# Ticket-Typen gemaess Jira-Ticket (TASK/BUG/STORY)
VALID_TYPES = {"task", "bug", "story"}

class TicketCreate(BaseModel):
    title: str
    description: str
    type: Optional[str] = "task"
    priority: Optional[str] = "medium"

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Titel darf nicht leer sein")
        return v

    @field_validator("type")
    @classmethod
    def type_valid(cls, v: Optional[str]) -> str:
        if v is None:
            return "task"
        if v.lower() not in VALID_TYPES:
            raise ValueError(f"Ungültiger Typ. Erlaubt: {sorted(VALID_TYPES)}")
        return v.lower()

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v: Optional[str]) -> str:
        if v is None:
            return "medium"
        if v.lower() not in VALID_PRIORITIES:
            raise ValueError(f"Ungültige Priorität. Erlaubt: {sorted(VALID_PRIORITIES)}")
        return v.lower()

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
    type: str = "task"
    category: str = "uncategorized"
    priority: str = "medium"
    ai_suggestion: Optional[str] = None
    created_at: str
    updated_at: str

class TicketAnalysis(BaseModel):
    category: str
    priority: str
    suggestion: str
