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
    from unittest.mock import patch
    # Ohne Vertex-Credentials: Mock-Antwort
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc"}).json()
    # ANTHROPIC_VERTEX_PROJECT_ID auf "mock" setzen → Fallback greift (kein echter API-Call)
    with patch.dict("os.environ", {"ANTHROPIC_VERTEX_PROJECT_ID": "mock"}):
        r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None

# ---------------------------------------------------------------------------
# AGSDLC-3: Tests fuer Ticket-Erstellung mit Typ und Prioritaet
# ---------------------------------------------------------------------------

def test_create_ticket_with_type_and_priority():
    """Ticket-Erstellung mit allen Pflichtfeldern: Titel, Beschreibung, Typ, Priorität."""
    r = client.post("/tickets", json={
        "title": "Neues Feature",
        "description": "Bitte um Implementierung",
        "type": "story",
        "priority": "high",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Neues Feature"
    assert data["type"] == "story"
    assert data["priority"] == "high"
    assert data["status"] == "open"
    assert "id" in data

def test_create_ticket_type_bug():
    """Bug-Ticket kann erstellt werden."""
    r = client.post("/tickets", json={
        "title": "Kritischer Fehler",
        "description": "System stürzt ab",
        "type": "bug",
        "priority": "critical",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["type"] == "bug"
    assert data["priority"] == "critical"

def test_create_ticket_type_task():
    """Task-Ticket kann erstellt werden."""
    r = client.post("/tickets", json={
        "title": "Routine-Aufgabe",
        "description": "Bitte erledigen",
        "type": "task",
        "priority": "low",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["type"] == "task"
    assert data["priority"] == "low"

def test_create_ticket_default_type_and_priority():
    """Ohne Typ/Priorität werden Standardwerte gesetzt."""
    r = client.post("/tickets", json={
        "title": "Standardwerte Test",
        "description": "Kein Typ, keine Prio angegeben",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["type"] == "task"     # Default
    assert data["priority"] == "medium"  # Default

def test_create_ticket_invalid_type():
    """Ungültiger Typ wird abgewiesen (422)."""
    r = client.post("/tickets", json={
        "title": "Ungültiger Typ",
        "description": "Test",
        "type": "epic",  # nicht erlaubt
        "priority": "low",
    })
    assert r.status_code == 422

def test_create_ticket_invalid_priority():
    """Ungültige Priorität wird abgewiesen (422)."""
    r = client.post("/tickets", json={
        "title": "Ungültige Prio",
        "description": "Test",
        "type": "task",
        "priority": "ultra",  # nicht erlaubt
    })
    assert r.status_code == 422

def test_create_ticket_missing_title():
    """Leerer Titel wird abgewiesen (422)."""
    r = client.post("/tickets", json={
        "title": "",
        "description": "Beschreibung vorhanden",
        "type": "task",
        "priority": "medium",
    })
    assert r.status_code == 422

def test_create_ticket_whitespace_title():
    """Nur-Leerzeichen-Titel wird abgewiesen (422)."""
    r = client.post("/tickets", json={
        "title": "   ",
        "description": "Beschreibung vorhanden",
        "type": "task",
        "priority": "medium",
    })
    assert r.status_code == 422

def test_create_ticket_returns_unique_id():
    """Jedes Ticket erhält eine eindeutige ID."""
    r1 = client.post("/tickets", json={"title": "Ticket 1", "description": "Desc 1"})
    r2 = client.post("/tickets", json={"title": "Ticket 2", "description": "Desc 2"})
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()["id"] != r2.json()["id"]

def test_created_ticket_appears_in_list():
    """Erstelltes Ticket erscheint in der Ticket-Liste."""
    r = client.post("/tickets", json={
        "title": "Sichtbares Ticket",
        "description": "Muss in Liste erscheinen",
        "type": "bug",
        "priority": "high",
    })
    assert r.status_code == 201
    ticket_id = r.json()["id"]

    list_r = client.get("/tickets")
    assert list_r.status_code == 200
    ids = [t["id"] for t in list_r.json()]
    assert ticket_id in ids

def test_create_ticket_all_valid_types():
    """Alle erlaubten Typen (task, bug, story) können verwendet werden."""
    for ticket_type in ["task", "bug", "story"]:
        r = client.post("/tickets", json={
            "title": f"Ticket vom Typ {ticket_type}",
            "description": "Test aller Typen",
            "type": ticket_type,
            "priority": "medium",
        })
        assert r.status_code == 201, f"Typ '{ticket_type}' sollte akzeptiert werden"
        assert r.json()["type"] == ticket_type

def test_create_ticket_all_valid_priorities():
    """Alle erlaubten Prioritäten (low, medium, high, critical) können verwendet werden."""
    for prio in ["low", "medium", "high", "critical"]:
        r = client.post("/tickets", json={
            "title": f"Ticket mit Prio {prio}",
            "description": "Test aller Prioritäten",
            "type": "task",
            "priority": prio,
        })
        assert r.status_code == 201, f"Priorität '{prio}' sollte akzeptiert werden"
        assert r.json()["priority"] == prio
