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
    # Ohne echte Vertex-Credentials: Fallback-Mock-Antwort prüfen.
    # Variable wird auf "mock" gesetzt, damit der Fallback-Zweig greift
    # und kein echter Vertex-API-Call ausgelöst wird.
    from unittest.mock import patch
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc"}).json()
    with patch.dict("os.environ", {"ANTHROPIC_VERTEX_PROJECT_ID": "mock"}):
        r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None

# ── AGSDLC-17: reporter_name Tests ──────────────────────────────────────────

def test_create_ticket_with_reporter_name():
    """Ticket mit Meldernamen erstellen und persistent speichern."""
    r = client.post("/tickets", json={
        "title": "Netzwerk ausgefallen",
        "description": "Kein Internetzugang seit 10 Uhr",
        "reporter_name": "Max Mustermann",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] == "Max Mustermann"

def test_create_ticket_reporter_name_persisted():
    """Gespeicherter Name ist über GET abrufbar (Detailansicht)."""
    created = client.post("/tickets", json={
        "title": "VPN Problem",
        "description": "VPN verbindet sich nicht",
        "reporter_name": "Erika Musterfrau",
    }).json()
    r = client.get(f"/tickets/{created['id']}")
    assert r.status_code == 200
    assert r.json()["reporter_name"] == "Erika Musterfrau"

def test_create_ticket_reporter_name_in_list():
    """Name erscheint in der Ticket-Übersicht (GET /tickets)."""
    created = client.post("/tickets", json={
        "title": "Drucker defekt",
        "description": "Drucker druckt nicht",
        "reporter_name": "Hans Schmidt",
    }).json()
    r = client.get("/tickets")
    assert r.status_code == 200
    tickets = r.json()
    matching = [t for t in tickets if t["id"] == created["id"]]
    assert len(matching) == 1
    assert matching[0]["reporter_name"] == "Hans Schmidt"

def test_create_ticket_without_reporter_name():
    """Ticket ohne Namen: reporter_name ist None (optionales Feld)."""
    r = client.post("/tickets", json={
        "title": "Anonymes Ticket",
        "description": "Kein Name angegeben",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] is None

def test_create_ticket_reporter_name_empty_string_treated_as_none():
    """Leerer String wird als kein Name behandelt (None)."""
    r = client.post("/tickets", json={
        "title": "Leerer Name Test",
        "description": "Name ist leer",
        "reporter_name": "   ",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["reporter_name"] is None

def test_create_ticket_reporter_name_max_length():
    """Name mit genau 100 Zeichen ist gültig."""
    name_100 = "A" * 100
    r = client.post("/tickets", json={
        "title": "Längentest",
        "description": "Name hat genau 100 Zeichen",
        "reporter_name": name_100,
    })
    assert r.status_code == 201
    assert r.json()["reporter_name"] == name_100

def test_create_ticket_reporter_name_too_long():
    """Name mit mehr als 100 Zeichen wird abgelehnt (422)."""
    name_101 = "B" * 101
    r = client.post("/tickets", json={
        "title": "Zu langer Name",
        "description": "Name überschreitet 100 Zeichen",
        "reporter_name": name_101,
    })
    assert r.status_code == 422

def test_ticket_response_has_reporter_name_field():
    """Das Ticket-Response-Modell enthält immer das Feld reporter_name."""
    r = client.post("/tickets", json={"title": "Feld Test", "description": "Prüfe Felder"})
    assert r.status_code == 201
    data = r.json()
    assert "reporter_name" in data

def test_update_ticket_reporter_name():
    """reporter_name kann über PUT aktualisiert werden."""
    created = client.post("/tickets", json={
        "title": "Update Name Test",
        "description": "Wird aktualisiert",
    }).json()
    r = client.put(f"/tickets/{created['id']}", json={"reporter_name": "Neuer Name"})
    assert r.status_code == 200
    assert r.json()["reporter_name"] == "Neuer Name"
