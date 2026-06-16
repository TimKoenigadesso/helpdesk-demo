from pydantic import BaseModel, Field, field_validator
from typing import Optional

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}

PRIORITY_LABELS = {
    "low": "Niedrig",
    "medium": "Mittel",
    "high": "Hoch",
    "critical": "Kritisch",
}

class TicketCreate(BaseModel):
    title: str
    description: str
    requester_name: str = Field(..., min_length=1, max_length=100)
    priority: str = "medium"

    @field_validator("requester_name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("requester_name darf nicht leer sein")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def priority_must_be_valid(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Ungültige Priorität. Erlaubt: {sorted(VALID_PRIORITIES)}")
        return v

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
    requester_name: str = ""
    created_at: str
    updated_at: str

class TicketAnalysis(BaseModel):
    category: str
    priority: str
    suggestion: str
