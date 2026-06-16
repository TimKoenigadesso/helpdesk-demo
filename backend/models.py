from pydantic import BaseModel, Field, field_validator
from typing import Optional

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}

REPORTER_NAME_MAX_LEN = 100

class TicketCreate(BaseModel):
    title: str
    description: str
    reporter_name: Optional[str] = Field(default=None, max_length=REPORTER_NAME_MAX_LEN)

    @field_validator("reporter_name")
    @classmethod
    def strip_reporter_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        return stripped if stripped else None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    ai_suggestion: Optional[str] = None
    reporter_name: Optional[str] = Field(default=None, max_length=REPORTER_NAME_MAX_LEN)

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
