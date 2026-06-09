import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_conn
from models import TicketCreate, TicketUpdate, Ticket, TicketAnalysis, VALID_PRIORITIES, VALID_CATEGORIES
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
    if update.category is not None:
        if update.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=422, detail=f"Invalid category. Must be one of: {VALID_CATEGORIES}")
        fields.append("category = ?"); values.append(update.category)
    if update.priority is not None:
        if update.priority not in VALID_PRIORITIES:
            raise HTTPException(status_code=422, detail=f"Invalid priority. Must be one of: {VALID_PRIORITIES}")
        fields.append("priority = ?"); values.append(update.priority)
    if update.ai_suggestion is not None:
        fields.append("ai_suggestion = ?"); values.append(update.ai_suggestion)
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
        row = conn.execute("SELECT id FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))

@app.post("/tickets/{ticket_id}/analyze", response_model=Ticket)
def analyze_ticket(ticket_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = dict(row)

    vertex_project = os.environ.get("ANTHROPIC_VERTEX_PROJECT_ID")
    if not vertex_project or vertex_project == "mock":
        # Fallback fuer lokale Entwicklung ohne Vertex-Credentials
        analysis = TicketAnalysis(
            category="bug",
            priority="medium",
            suggestion="Vielen Dank fuer Ihre Meldung. Wir haben das Ticket aufgenommen und werden es schnellstmoeglich bearbeiten.",
        )
    else:
        try:
            from anthropic import AnthropicVertex
            client = AnthropicVertex(
                project_id=vertex_project,
                region=os.environ.get("CLOUD_ML_REGION", "europe-west1"),
            )
            prompt = (
                f"Analysiere dieses Helpdesk-Ticket und antworte ausschliesslich als JSON.\n\n"
                f"Titel: {ticket['title']}\n"
                f"Beschreibung: {ticket['description']}\n\n"
                f"Antworte mit exakt diesem JSON-Format (keine weiteren Texte):\n"
                f'{{\"category\": \"bug|feature|question|access|infrastructure\", '
                f'\"priority\": \"low|medium|high|critical\", '
                f'\"suggestion\": \"Kurzantwort 1-2 Saetze\"}}'
            )
            message = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = message.content[0].text.strip()
            data = json.loads(raw)
            analysis = TicketAnalysis(
                category=data.get("category", "uncategorized") if data.get("category") in VALID_CATEGORIES else "uncategorized",
                priority=data.get("priority", "medium") if data.get("priority") in VALID_PRIORITIES else "medium",
                suggestion=data.get("suggestion", ""),
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"KI-Analyse fehlgeschlagen: {str(e)}")

    with get_conn() as conn:
        conn.execute(
            "UPDATE tickets SET category = ?, priority = ?, ai_suggestion = ?, updated_at = datetime('now') WHERE id = ?",
            (analysis.category, analysis.priority, analysis.suggestion, ticket_id),
        )
        row = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    return dict(row)
