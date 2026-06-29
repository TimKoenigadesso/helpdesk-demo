import json
import os
import threading
import urllib.request
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_conn
from models import (
    TicketCreate, TicketUpdate, Ticket, TicketAnalysis,
    CommentCreate, Comment,
    VALID_PRIORITIES, VALID_CATEGORIES, VALID_AUTHORS,
)
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
    # Auto-Seed bei leerer DB (z.B. nach Cloud Run Cold Start)
    with get_conn() as conn:
        count = conn.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
    if count == 0:
        with get_conn() as conn:
            for t in SEED_TICKETS:
                conn.execute(
                    "INSERT INTO tickets (title, description, status, category, priority) VALUES (?, ?, ?, ?, ?)",
                    (t["title"], t["description"], t["status"], t["category"], t["priority"]),
                )

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/tickets", response_model=List[Ticket])
def list_tickets(sort: str = "created_at"):
    """Tickets auflisten. sort=priority_lastname sortiert nach Priorität (desc) und Nachname (asc)."""
    PRIORITY_ORDER = "CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END"
    if sort == "priority_lastname":
        order_clause = f"{PRIORITY_ORDER} ASC, last_name ASC"
    else:
        order_clause = "created_at DESC"
    with get_conn() as conn:
        rows = conn.execute(f"SELECT * FROM tickets ORDER BY {order_clause}").fetchall()
    return [dict(r) for r in rows]

@app.post("/tickets", response_model=Ticket, status_code=201)
def create_ticket(ticket: TicketCreate):
    priority = ticket.priority if ticket.priority in VALID_PRIORITIES else "medium"
    first_name = (ticket.first_name or "").strip()
    last_name = (ticket.last_name or "").strip()
    reporter_name = (ticket.reporter_name or "").strip()[:100]
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO tickets (title, description, priority, first_name, last_name, reporter_name) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
            (ticket.title, ticket.description, priority, first_name, last_name, reporter_name),
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
    if update.first_name is not None:
        fields.append("first_name = ?"); values.append(update.first_name.strip())
    if update.last_name is not None:
        fields.append("last_name = ?"); values.append(update.last_name.strip())
    if update.reporter_name is not None:
        fields.append("reporter_name = ?"); values.append(update.reporter_name.strip()[:100])
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

# ── Kommentar-Routen ─────────────────────────────────────────────────────────

@app.get("/tickets/{ticket_id}/comments", response_model=List[Comment])
def list_comments(ticket_id: int):
    """Alle Kommentare eines Tickets auflisten."""
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        rows = conn.execute(
            "SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC",
            (ticket_id,),
        ).fetchall()
    return [dict(r) for r in rows]

@app.post("/tickets/{ticket_id}/comments", response_model=Comment, status_code=201)
def create_comment(ticket_id: int, comment: CommentCreate):
    """Neuen Kommentar zu einem Ticket hinzufügen."""
    if not comment.body.strip():
        raise HTTPException(status_code=422, detail="Comment body must not be empty")
    author = comment.author if comment.author in VALID_AUTHORS else "Mitarbeiter"
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        cur = conn.execute(
            "INSERT INTO comments (ticket_id, author, body) VALUES (?, ?, ?) RETURNING *",
            (ticket_id, author, comment.body.strip()),
        )
        new_row = cur.fetchone()
    return dict(new_row)

@app.delete("/tickets/{ticket_id}/comments/{comment_id}", status_code=204)
def delete_comment(ticket_id: int, comment_id: int):
    """Kommentar löschen (nur Admin)."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM comments WHERE id = ? AND ticket_id = ?",
            (comment_id, ticket_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Comment not found")
        conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))

# ── Seed-Daten & Demo-Reset ──────────────────────────────────────────────────

SEED_TICKETS = [
    {
        "title": "VPN-Verbindung bricht nach ~5 Minuten ab",
        "description": "Seit dem letzten Windows-Update trennt sich der Cisco AnyConnect VPN nach ca. 5 Minuten Inaktivität. Beim erneuten Verbinden erscheint Fehler 'Authentication failed'. Betrifft mehrere Kollegen im Büro Hamburg.",
        "status": "open", "category": "infrastructure", "priority": "high",
    },
    {
        "title": "Passwort abgelaufen — Konto gesperrt",
        "description": "Nach Urlaub ist mein Windows-Konto gesperrt. Ich komme weder ins Active Directory noch in Outlook. Bitte Konto entsperren und temporäres Passwort setzen.",
        "status": "open", "category": "access", "priority": "high",
    },
    {
        "title": "Drucker im 3. OG druckt nur weiße Seiten",
        "description": "Der Netzwerkdrucker HP LaserJet M428 (IP 10.0.3.45) druckt seit heute Morgen nur leere Seiten. Toner wurde letzte Woche gewechselt. Testseite direkt am Gerät funktioniert korrekt.",
        "status": "open", "category": "infrastructure", "priority": "medium",
    },
    {
        "title": "Excel kann keine .pdf-Dateien als Anhang öffnen",
        "description": "Wenn ich in Excel auf einen eingebetteten PDF-Anhang doppelklicke, erscheint die Fehlermeldung 'Das Programm kann nicht geöffnet werden'. Adobe Acrobat ist installiert. Betrifft nur Excel, in Outlook funktionieren PDFs normal.",
        "status": "open", "category": "bug", "priority": "low",
    },
]

def _trigger_reset_pipeline() -> None:
    """Triggert reset-demo Pipeline asynchron (fire & forget)."""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        return
    payload = json.dumps({
        "ref": "main",
        "inputs": {"pipeline_type": "reset-demo", "jira_ticket_id": ""}
    }).encode()
    req = urllib.request.Request(
        "https://api.github.com/repos/TimKoenigadesso/helpdesk-demo/actions/workflows/pipeline.yml/dispatches",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[reset] Pipeline-Trigger fehlgeschlagen: {e}")


@app.post("/reset", status_code=200)
def reset_demo():
    """Setzt die Demo-DB zurück, befüllt Seed-Tickets und startet v0-Redeploy-Pipeline."""
    with get_conn() as conn:
        conn.execute("DELETE FROM comments")
        conn.execute("DELETE FROM tickets")
        try:
            conn.execute("DELETE FROM sqlite_sequence WHERE name='tickets'")
            conn.execute("DELETE FROM sqlite_sequence WHERE name='comments'")
        except Exception:
            pass
        for t in SEED_TICKETS:
            conn.execute(
                "INSERT INTO tickets (title, description, status, category, priority) VALUES (?, ?, ?, ?, ?)",
                (t["title"], t["description"], t["status"], t["category"], t["priority"]),
            )
    # v0-Code-Redeploy asynchron starten (dauert ~2-3 Min)
    threading.Thread(target=_trigger_reset_pipeline, daemon=True).start()
    return {"ok": True, "seeded": len(SEED_TICKETS), "pipeline": "reset-demo gestartet"}

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
