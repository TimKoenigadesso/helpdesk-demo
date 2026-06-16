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
    r = client.post("/tickets", json={
        "title": "Test Ticket",
        "description": "Test Beschreibung",
        "requester_name": "Max Mustermann",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test Ticket"
    assert data["status"] == "open"
    assert "id" in data

def test_list_tickets():
    client.post("/tickets", json={"title": "Ticket A", "description": "Desc A", "requester_name": "Max Mustermann"})
    r = client.get("/tickets")
    assert r.status_code == 200
    assert len(r.json()) >= 1

def test_get_ticket():
    created = client.post("/tickets", json={"title": "Detail Test", "description": "Desc", "requester_name": "Erika Musterfrau"}).json()
    r = client.get(f"/tickets/{created['id']}")
    assert r.status_code == 200
    assert r.json()["title"] == "Detail Test"

def test_get_ticket_not_found():
    r = client.get("/tickets/99999")
    assert r.status_code == 404

def test_update_ticket_status():
    created = client.post("/tickets", json={"title": "Update Test", "description": "Desc", "requester_name": "Hans Schmidt"}).json()
    r = client.put(f"/tickets/{created['id']}", json={"status": "closed"})
    assert r.status_code == 200
    assert r.json()["status"] == "closed"

def test_delete_ticket():
    created = client.post("/tickets", json={"title": "Delete Test", "description": "Desc", "requester_name": "Anna Müller"}).json()
    r = client.delete(f"/tickets/{created['id']}")
    assert r.status_code == 204
    r2 = client.get(f"/tickets/{created['id']}")
    assert r2.status_code == 404

def test_ticket_has_category_and_priority():
    r = client.post("/tickets", json={"title": "Felder Test", "description": "Desc", "requester_name": "Test User"})
    assert r.status_code == 201
    data = r.json()
    assert data["category"] == "uncategorized"
    assert data["priority"] == "medium"
    assert data["ai_suggestion"] is None

def test_update_ticket_priority():
    created = client.post("/tickets", json={"title": "Prio Test", "description": "Desc", "requester_name": "Test User"}).json()
    r = client.put(f"/tickets/{created['id']}", json={"priority": "high"})
    assert r.status_code == 200
    assert r.json()["priority"] == "high"

def test_update_ticket_invalid_priority():
    created = client.post("/tickets", json={"title": "Invalid Prio", "description": "Desc", "requester_name": "Test User"}).json()
    r = client.put(f"/tickets/{created['id']}", json={"priority": "ultra"})
    assert r.status_code == 422

# ── AGSDLC-18: Name & Priorität bei Anfrage ──────────────────────────────────

def test_create_ticket_with_requester_name_and_priority():
    """Ticket mit Name und Priorität erstellen — beides wird korrekt gespeichert."""
    r = client.post("/tickets", json={
        "title": "Name & Prio Test",
        "description": "Ticket mit Name und Priorität",
        "requester_name": "Maria Musterfrau",
        "priority": "high",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["requester_name"] == "Maria Musterfrau"
    assert data["priority"] == "high"

def test_create_ticket_default_priority_is_medium():
    """Wenn keine Priorität angegeben, wird 'medium' als Standard gesetzt."""
    r = client.post("/tickets", json={
        "title": "Default Prio Test",
        "description": "Ohne Priorität",
        "requester_name": "Karl Beispiel",
    })
    assert r.status_code == 201
    assert r.json()["priority"] == "medium"

def test_create_ticket_missing_requester_name_returns_422():
    """Pflichtfeld 'requester_name' fehlt → 422 Validierungsfehler."""
    r = client.post("/tickets", json={
        "title": "Kein Name",
        "description": "Ohne Namen",
    })
    assert r.status_code == 422

def test_create_ticket_empty_requester_name_returns_422():
    """Leerer Name (nur Leerzeichen) → 422 Validierungsfehler."""
    r = client.post("/tickets", json={
        "title": "Leerer Name",
        "description": "Nur Leerzeichen",
        "requester_name": "   ",
    })
    assert r.status_code == 422

def test_create_ticket_requester_name_too_long_returns_422():
    """Name länger als 100 Zeichen → 422 Validierungsfehler."""
    r = client.post("/tickets", json={
        "title": "Langer Name",
        "description": "Name zu lang",
        "requester_name": "A" * 101,
    })
    assert r.status_code == 422

def test_create_ticket_requester_name_max_length_ok():
    """Name mit exakt 100 Zeichen ist gültig."""
    r = client.post("/tickets", json={
        "title": "Max Name Test",
        "description": "Name genau 100 Zeichen",
        "requester_name": "A" * 100,
    })
    assert r.status_code == 201
    assert r.json()["requester_name"] == "A" * 100

def test_create_ticket_all_valid_priorities():
    """Alle gültigen Prioritätsstufen können gesetzt werden."""
    for prio in ["low", "medium", "high", "critical"]:
        r = client.post("/tickets", json={
            "title": f"Prio {prio}",
            "description": "Test",
            "requester_name": "Test User",
            "priority": prio,
        })
        assert r.status_code == 201, f"Priorität '{prio}' sollte gültig sein"
        assert r.json()["priority"] == prio

def test_create_ticket_invalid_priority_returns_422():
    """Ungültige Priorität → 422 Validierungsfehler."""
    r = client.post("/tickets", json={
        "title": "Ungültige Prio",
        "description": "Test",
        "requester_name": "Test User",
        "priority": "ultra",
    })
    assert r.status_code == 422

def test_ticket_requester_name_visible_in_list():
    """Name ist in der Ticket-Liste sichtbar."""
    client.post("/tickets", json={
        "title": "Listen-Test Ticket",
        "description": "Sichtbarkeit in Liste",
        "requester_name": "Sichtbarer Nutzer",
        "priority": "low",
    })
    r = client.get("/tickets")
    assert r.status_code == 200
    tickets = r.json()
    names = [t["requester_name"] for t in tickets]
    assert "Sichtbarer Nutzer" in names

def test_create_ticket_name_gets_stripped():
    """Führende/nachfolgende Leerzeichen im Namen werden entfernt."""
    r = client.post("/tickets", json={
        "title": "Strip Test",
        "description": "Leerzeichen trimmen",
        "requester_name": "  Max Mustermann  ",
    })
    assert r.status_code == 201
    assert r.json()["requester_name"] == "Max Mustermann"

def test_analyze_ticket():
    import sys
    from unittest.mock import MagicMock, patch

    created = client.post("/tickets", json={"title": "Server haengt", "description": "Produktionsserver antwortet nicht", "requester_name": "Test User"}).json()

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
    # Ohne Vertex-Credentials: Mock-Fallback greift (Variable entfernen damit kein echter API-Call)
    from unittest.mock import patch
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc", "requester_name": "Test User"}).json()
    # ANTHROPIC_VERTEX_PROJECT_ID entfernen → Fallback-Pfad im Backend greift
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("ANTHROPIC_VERTEX_PROJECT_ID", None)
        r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None
