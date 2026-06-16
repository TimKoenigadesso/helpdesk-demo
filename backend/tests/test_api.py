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
    # Ohne Vertex-Credentials (Variable entfernt): Mock-Fallback greift
    from unittest.mock import patch
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc"}).json()
    # Variable explizit entfernen, damit der Fallback-Pfad im Backend ausgeloest wird
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("ANTHROPIC_VERTEX_PROJECT_ID", None)
        r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None

# ── AGSDLC-17: reporter_name Tests ──────────────────────────────────────────

def test_create_ticket_with_reporter_name():
    """Ticket mit Namen erstellen – Name wird persistent gespeichert."""
    r = client.post("/tickets", json={
        "title": "Reporter Test",
        "description": "Beschreibung",
        "reporter_name": "Max Mustermann",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] == "Max Mustermann"

def test_create_ticket_without_reporter_name():
    """Ticket ohne Namen erstellen – reporter_name ist None (optionales Feld)."""
    r = client.post("/tickets", json={"title": "Kein Name", "description": "Desc"})
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] is None

def test_reporter_name_persisted_and_retrievable():
    """Name wird gespeichert und per GET wieder abrufbar."""
    created = client.post("/tickets", json={
        "title": "Persistenz Test",
        "description": "Desc",
        "reporter_name": "Erika Musterfrau",
    }).json()
    ticket_id = created["id"]

    r = client.get(f"/tickets/{ticket_id}")
    assert r.status_code == 200
    assert r.json()["reporter_name"] == "Erika Musterfrau"

def test_reporter_name_in_list():
    """Name erscheint auch in der Ticket-Übersicht."""
    client.post("/tickets", json={
        "title": "List Test",
        "description": "Desc",
        "reporter_name": "Hans Müller",
    })
    r = client.get("/tickets")
    assert r.status_code == 200
    names = [t["reporter_name"] for t in r.json()]
    assert "Hans Müller" in names

def test_reporter_name_max_length_exceeded():
    """Name mit mehr als 100 Zeichen wird mit 422 abgelehnt."""
    long_name = "A" * 101
    r = client.post("/tickets", json={
        "title": "Zu langer Name",
        "description": "Desc",
        "reporter_name": long_name,
    })
    assert r.status_code == 422

def test_reporter_name_max_length_exact():
    """Name mit genau 100 Zeichen wird akzeptiert."""
    exact_name = "B" * 100
    r = client.post("/tickets", json={
        "title": "Exakt 100 Zeichen",
        "description": "Desc",
        "reporter_name": exact_name,
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] == exact_name

def test_reporter_name_whitespace_only_stored_as_none():
    """Ein Name aus nur Leerzeichen wird als None gespeichert."""
    r = client.post("/tickets", json={
        "title": "Whitespace Name",
        "description": "Desc",
        "reporter_name": "   ",
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] is None

def test_reporter_name_stripped():
    """Führende und nachfolgende Leerzeichen werden entfernt."""
    r = client.post("/tickets", json={
        "title": "Strip Test",
        "description": "Desc",
        "reporter_name": "  Anna Schmidt  ",
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] == "Anna Schmidt"
