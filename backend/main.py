from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_conn
from models import TicketCreate, TicketUpdate, Ticket
from typing import List

app = FastAPI(title="Helpdesk Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://frontend:80", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/tickets", response_model=List[Ticket])
def list_tickets():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]

@app.post("/tickets", response_model=Ticket, status_code=201)
def create_ticket(ticket: TicketCreate):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO tickets (title, description) VALUES (?, ?) RETURNING *",
            (ticket.title, ticket.description),
        )
        row = cur.fetchone()
    return dict(row)

@app.get("/tickets/{ticket_id}", response_model=Ticket)
def get_ticket(ticket_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return dict(row)

@app.put("/tickets/{ticket_id}", response_model=Ticket)
def update_ticket(ticket_id: int, update: TicketUpdate):
    fields, values = [], []
    if update.title is not None:
        fields.append("title = ?"); values.append(update.title)
    if update.description is not None:
        fields.append("description = ?"); values.append(update.description)
    if update.status is not None:
        fields.append("status = ?"); values.append(update.status)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    fields.append("updated_at = datetime('now')")
    values.append(ticket_id)
    with get_conn() as conn:
        conn.execute(f"UPDATE tickets SET {', '.join(fields)} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return dict(row)

@app.delete("/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
