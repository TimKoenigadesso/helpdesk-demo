from pydantic import BaseModel
from typing import Optional

class TicketCreate(BaseModel):
    title: str
    description: str

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Ticket(BaseModel):
    id: int
    title: str
    description: str
    status: str
    created_at: str
    updated_at: str
