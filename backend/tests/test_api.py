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
    # Ohne Vertex-Credentials: Mock-Antwort
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc"}).json()
    # ANTHROPIC_VERTEX_PROJECT_ID ist in Tests nicht gesetzt → Fallback greift
    r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None
