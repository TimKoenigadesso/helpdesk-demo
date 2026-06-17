import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DB_PATH', '/tmp/test_helpdesk.db')

import pytest
from fastapi.testclient import TestClient

# Override DB path for tests
import database
database.DB_PATH = __import__('pathlib').Path('/tmp/test_helpdesk.db')

from main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    database.init_db()
    yield
    if database.DB_PATH.exists():
        database.DB_PATH.unlink()

# ── Basis-Tests ───────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_create_ticket():
    r = client.post("/tickets", json={"title": "Test Ticket", "description": "Test Beschreibung"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test Ticket"
    assert data["status"] == "open"
    assert "id" in data

def test_list_tickets():
    client.post("/tickets", json={"title": "Ticket A", "description": "Desc A"})
    r = client.get("/tickets")
    assert r.status_code == 200
    assert len(r.json()) >= 1

def test_get_ticket():
    created = client.post("/tickets", json={"title": "Detail Test", "description": "Desc"}).json()
    r = client.get(f"/tickets/{created['id']}")
    assert r.status_code == 200
    assert r.json()["title"] == "Detail Test"

def test_get_ticket_not_found():
    r = client.get("/tickets/99999")
    assert r.status_code == 404

def test_update_ticket_status():
    created = client.post("/tickets", json={"title": "Update Test", "description": "Desc"}).json()
    r = client.put(f"/tickets/{created['id']}", json={"status": "closed"})
    assert r.status_code == 200
    assert r.json()["status"] == "closed"

def test_delete_ticket():
    created = client.post("/tickets", json={"title": "Delete Test", "description": "Desc"}).json()
    r = client.delete(f"/tickets/{created['id']}")
    assert r.status_code == 204
    r2 = client.get(f"/tickets/{created['id']}")
    assert r2.status_code == 404

def test_ticket_has_category_and_priority():
    r = client.post("/tickets", json={"title": "Felder Test", "description": "Desc"})
    assert r.status_code == 201
    data = r.json()
    assert data["category"] == "uncategorized"
    assert data["priority"] == "medium"
    assert data["ai_suggestion"] is None

def test_update_ticket_priority():
    created = client.post("/tickets", json={"title": "Prio Test", "description": "Desc"}).json()
    r = client.put(f"/tickets/{created['id']}", json={"priority": "high"})
    assert r.status_code == 200
    assert r.json()["priority"] == "high"

def test_update_ticket_invalid_priority():
    created = client.post("/tickets", json={"title": "Invalid Prio", "description": "Desc"}).json()
    r = client.put(f"/tickets/{created['id']}", json={"priority": "ultra"})
    assert r.status_code == 422

# ── Prioritäts-Feature-Tests (AGSDLC-6) ──────────────────────────────────────

def test_create_ticket_with_priority_low():
    """Ticket mit Priorität 'low' erstellen."""
    r = client.post("/tickets", json={"title": "Prio Low", "description": "Desc", "priority": "low"})
    assert r.status_code == 201
    assert r.json()["priority"] == "low"

def test_create_ticket_with_priority_medium():
    """Ticket mit Priorität 'medium' erstellen."""
    r = client.post("/tickets", json={"title": "Prio Medium", "description": "Desc", "priority": "medium"})
    assert r.status_code == 201
    assert r.json()["priority"] == "medium"

def test_create_ticket_with_priority_high():
    """Ticket mit Priorität 'high' erstellen."""
    r = client.post("/tickets", json={"title": "Prio High", "description": "Desc", "priority": "high"})
    assert r.status_code == 201
    assert r.json()["priority"] == "high"

def test_create_ticket_with_priority_critical():
    """Ticket mit Priorität 'critical' erstellen."""
    r = client.post("/tickets", json={"title": "Prio Critical", "description": "Desc", "priority": "critical"})
    assert r.status_code == 201
    assert r.json()["priority"] == "critical"

def test_create_ticket_default_priority_is_medium():
    """Ohne Priorität wird automatisch 'medium' gesetzt."""
    r = client.post("/tickets", json={"title": "Default Prio", "description": "Desc"})
    assert r.status_code == 201
    assert r.json()["priority"] == "medium"

def test_create_ticket_invalid_priority_falls_back_to_medium():
    """Ungültige Priorität wird auf 'medium' zurückgesetzt."""
    r = client.post("/tickets", json={"title": "Bad Prio", "description": "Desc", "priority": "extreme"})
    assert r.status_code == 201
    assert r.json()["priority"] == "medium"

def test_priority_visible_in_list():
    """Gespeicherte Priorität erscheint in der Ticket-Übersichtsliste."""
    client.post("/tickets", json={"title": "List Prio Test", "description": "Desc", "priority": "high"})
    tickets = client.get("/tickets").json()
    prio_ticket = next((t for t in tickets if t["title"] == "List Prio Test"), None)
    assert prio_ticket is not None
    assert prio_ticket["priority"] == "high"

def test_priority_visible_in_detail():
    """Gespeicherte Priorität erscheint in der Ticket-Detailansicht."""
    created = client.post("/tickets", json={"title": "Detail Prio Test", "description": "Desc", "priority": "critical"}).json()
    detail = client.get(f"/tickets/{created['id']}").json()
    assert detail["priority"] == "critical"

def test_update_priority_low_to_critical():
    """Priorität von 'low' auf 'critical' ändern."""
    created = client.post("/tickets", json={"title": "Change Prio", "description": "Desc", "priority": "low"}).json()
    assert created["priority"] == "low"
    updated = client.put(f"/tickets/{created['id']}", json={"priority": "critical"}).json()
    assert updated["priority"] == "critical"

def test_update_priority_critical_to_low():
    """Priorität von 'critical' auf 'low' ändern."""
    created = client.post("/tickets", json={"title": "Downgrade Prio", "description": "Desc", "priority": "critical"}).json()
    updated = client.put(f"/tickets/{created['id']}", json={"priority": "low"}).json()
    assert updated["priority"] == "low"

def test_all_priority_values_are_valid():
    """Alle vier Prioritätsstufen sind gültig und werden korrekt gespeichert."""
    for prio in ["low", "medium", "high", "critical"]:
        r = client.post("/tickets", json={"title": f"Prio {prio}", "description": "Desc", "priority": prio})
        assert r.status_code == 201
        assert r.json()["priority"] == prio

def test_analyze_ticket():
    import sys
    from unittest.mock import MagicMock, patch

    created = client.post("/tickets", json={"title": "Server haengt", "description": "Produktionsserver antwortet nicht"}).json()

    mock_message = MagicMock()
    mock_message.content = [MagicMock(text='{"category": "infrastructure", "priority": "critical", "suggestion": "Wir pruefen das sofort."}')]

    mock_vertex_instance = MagicMock()
    mock_vertex_instance.messages.create.return_value = mock_message

    mock_anthropic_module = MagicMock()
    mock_anthropic_module.AnthropicVertex.return_value = mock_vertex_instance

    with patch.dict("os.environ", {"ANTHROPIC_VERTEX_PROJECT_ID": "test-project"}):
        with patch.dict(sys.modules, {"anthropic": mock_anthropic_module}):
            r = client.post(f"/tickets/{created['id']}/analyze")

    assert r.status_code == 200
    data = r.json()
    assert data["category"] == "infrastructure"
    assert data["priority"] == "critical"
    assert data["ai_suggestion"] == "Wir pruefen das sofort."

def test_analyze_ticket_not_found():
    r = client.post("/tickets/99999/analyze")
    assert r.status_code == 404

def test_analyze_ticket_fallback():
    """Ohne Vertex-Credentials: Mock-Antwort (Fallback-Pfad)."""
    from unittest.mock import patch
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc"}).json()
    # Sicherstellen dass ANTHROPIC_VERTEX_PROJECT_ID NICHT gesetzt ist → Fallback greift
    with patch.dict("os.environ", {}, clear=False):
        os.environ.pop("ANTHROPIC_VERTEX_PROJECT_ID", None)
        r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None

# ── Kommentar-Tests ───────────────────────────────────────────────────────────

def _create_ticket(title: str = "Kommentar Test Ticket") -> dict:
    """Hilfsfunktion: Ticket erstellen und zurückgeben."""
    r = client.post("/tickets", json={"title": title, "description": "Beschreibung"})
    assert r.status_code == 201
    return r.json()

def test_list_comments_empty():
    """Leere Kommentarliste für neues Ticket."""
    ticket = _create_ticket()
    r = client.get(f"/tickets/{ticket['id']}/comments")
    assert r.status_code == 200
    assert r.json() == []

def test_list_comments_ticket_not_found():
    """Kommentarliste für nicht existierendes Ticket → 404."""
    r = client.get("/tickets/99999/comments")
    assert r.status_code == 404

def test_create_comment():
    """Kommentar erstellen — Pflichtfelder und Rückgabe prüfen."""
    ticket = _create_ticket()
    r = client.post(
        f"/tickets/{ticket['id']}/comments",
        json={"body": "Mein erster Kommentar", "author": "Mitarbeiter"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["body"] == "Mein erster Kommentar"
    assert data["author"] == "Mitarbeiter"
    assert data["ticket_id"] == ticket["id"]
    assert "id" in data
    assert "created_at" in data

def test_create_comment_admin_author():
    """Admin-Kommentar erstellen."""
    ticket = _create_ticket()
    r = client.post(
        f"/tickets/{ticket['id']}/comments",
        json={"body": "Admin-Hinweis", "author": "IT-Admin"},
    )
    assert r.status_code == 201
    assert r.json()["author"] == "IT-Admin"

def test_create_comment_invalid_author_falls_back_to_mitarbeiter():
    """Ungültiger Autor wird auf 'Mitarbeiter' zurückgesetzt."""
    ticket = _create_ticket()
    r = client.post(
        f"/tickets/{ticket['id']}/comments",
        json={"body": "Kommentar", "author": "Hacker"},
    )
    assert r.status_code == 201
    assert r.json()["author"] == "Mitarbeiter"

def test_create_comment_empty_body():
    """Leerer Kommentar → 422."""
    ticket = _create_ticket()
    r = client.post(
        f"/tickets/{ticket['id']}/comments",
        json={"body": "   ", "author": "Mitarbeiter"},
    )
    assert r.status_code == 422

def test_create_comment_ticket_not_found():
    """Kommentar für nicht existierendes Ticket → 404."""
    r = client.post(
        "/tickets/99999/comments",
        json={"body": "Irgendwas", "author": "Mitarbeiter"},
    )
    assert r.status_code == 404

def test_list_comments_returns_all():
    """Mehrere Kommentare werden in chronologischer Reihenfolge zurückgegeben."""
    ticket = _create_ticket()
    tid = ticket["id"]
    client.post(f"/tickets/{tid}/comments", json={"body": "Erster", "author": "Mitarbeiter"})
    client.post(f"/tickets/{tid}/comments", json={"body": "Zweiter", "author": "IT-Admin"})
    r = client.get(f"/tickets/{tid}/comments")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    assert data[0]["body"] == "Erster"
    assert data[1]["body"] == "Zweiter"

def test_delete_comment():
    """Kommentar löschen — danach nicht mehr in der Liste."""
    ticket = _create_ticket()
    tid = ticket["id"]
    comment = client.post(
        f"/tickets/{tid}/comments",
        json={"body": "Zu löschender Kommentar", "author": "IT-Admin"},
    ).json()
    cid = comment["id"]

    r = client.delete(f"/tickets/{tid}/comments/{cid}")
    assert r.status_code == 204

    remaining = client.get(f"/tickets/{tid}/comments").json()
    assert all(c["id"] != cid for c in remaining)

def test_delete_comment_not_found():
    """Nicht existierenden Kommentar löschen → 404."""
    ticket = _create_ticket()
    r = client.delete(f"/tickets/{ticket['id']}/comments/99999")
    assert r.status_code == 404

def test_delete_comment_wrong_ticket():
    """Kommentar eines anderen Tickets löschen → 404."""
    ticket_a = _create_ticket("Ticket A")
    ticket_b = _create_ticket("Ticket B")
    comment = client.post(
        f"/tickets/{ticket_a['id']}/comments",
        json={"body": "Kommentar auf A", "author": "Mitarbeiter"},
    ).json()
    # Versuch, Kommentar von Ticket A über Ticket-B-Route zu löschen
    r = client.delete(f"/tickets/{ticket_b['id']}/comments/{comment['id']}")
    assert r.status_code == 404

def test_delete_ticket_cascades_comments():
    """Wenn ein Ticket gelöscht wird, werden alle Kommentare mitgelöscht."""
    ticket = _create_ticket()
    tid = ticket["id"]
    client.post(f"/tickets/{tid}/comments", json={"body": "Wird mitgelöscht", "author": "Mitarbeiter"})

    # Ticket löschen
    r = client.delete(f"/tickets/{tid}")
    assert r.status_code == 204

    # Ticket existiert nicht mehr → 404
    assert client.get(f"/tickets/{tid}").status_code == 404

def test_reset_clears_comments():
    """Nach /reset sind alle Kommentare gelöscht."""
    ticket = _create_ticket()
    tid = ticket["id"]
    client.post(f"/tickets/{tid}/comments", json={"body": "Reset-Test", "author": "Mitarbeiter"})

    r = client.post("/reset")
    assert r.status_code == 200

    # Seed-Tickets vorhanden, aber keine Kommentare mehr
    tickets = client.get("/tickets").json()
    assert len(tickets) > 0
    for t in tickets:
        comments = client.get(f"/tickets/{t['id']}/comments").json()
        assert comments == []

# ── Melder-Name-Tests (AGSDLC-17) ────────────────────────────────────────────

def test_create_ticket_with_reporter_name():
    """Ticket mit Meldernamen erstellen — Name wird gespeichert und zurückgegeben."""
    r = client.post("/tickets", json={
        "title": "Name Test Ticket",
        "description": "Ticket mit Meldername",
        "reporter_name": "Max Mustermann",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] == "Max Mustermann"

def test_create_ticket_without_reporter_name():
    """Ticket ohne Meldernamen — reporter_name ist None (optionales Feld)."""
    r = client.post("/tickets", json={
        "title": "Anonym Ticket",
        "description": "Kein Name angegeben",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] is None

def test_reporter_name_visible_in_list():
    """Gespeicherter Meldername erscheint in der Ticket-Übersichtsliste."""
    client.post("/tickets", json={
        "title": "List Name Test",
        "description": "Sichtbarkeit in Liste prüfen",
        "reporter_name": "Erika Musterfrau",
    })
    tickets = client.get("/tickets").json()
    found = next((t for t in tickets if t["title"] == "List Name Test"), None)
    assert found is not None
    assert found["reporter_name"] == "Erika Musterfrau"

def test_reporter_name_visible_in_detail():
    """Gespeicherter Meldername erscheint in der Ticket-Detailansicht."""
    created = client.post("/tickets", json={
        "title": "Detail Name Test",
        "description": "Sichtbarkeit in Detailansicht prüfen",
        "reporter_name": "Hans Schmidt",
    }).json()
    detail = client.get(f"/tickets/{created['id']}").json()
    assert detail["reporter_name"] == "Hans Schmidt"

def test_reporter_name_whitespace_is_stripped():
    """Meldername mit führenden/nachfolgenden Leerzeichen wird bereinigt."""
    r = client.post("/tickets", json={
        "title": "Whitespace Name Test",
        "description": "Leerzeichen werden entfernt",
        "reporter_name": "  Anna Müller  ",
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] == "Anna Müller"

def test_reporter_name_only_whitespace_stored_as_none():
    """Meldername aus nur Leerzeichen wird als None gespeichert."""
    r = client.post("/tickets", json={
        "title": "Whitespace Only Name Test",
        "description": "Nur Leerzeichen im Namen",
        "reporter_name": "   ",
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] is None

def test_reporter_name_max_length_accepted():
    """Meldername mit genau 100 Zeichen wird akzeptiert."""
    long_name = "A" * 100
    r = client.post("/tickets", json={
        "title": "Max Length Name Test",
        "description": "Name mit genau 100 Zeichen",
        "reporter_name": long_name,
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] == long_name

def test_reporter_name_too_long_rejected():
    """Meldername mit mehr als 100 Zeichen wird abgelehnt (422)."""
    too_long = "B" * 101
    r = client.post("/tickets", json={
        "title": "Too Long Name Test",
        "description": "Name überschreitet Maximallänge",
        "reporter_name": too_long,
    })
    assert r.status_code == 422
