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
    # Ohne Vertex-Credentials: Mock-Antwort (Fallback-Pfad)
    # Wir setzen ANTHROPIC_VERTEX_PROJECT_ID explizit auf "mock", damit der
    # Fallback-Zweig greift – unabhaengig davon, ob die Variable in der CI gesetzt ist.
    from unittest.mock import patch
    created = client.post("/tickets", json={"title": "Fallback Test", "description": "Desc"}).json()
    with patch.dict("os.environ", {"ANTHROPIC_VERTEX_PROJECT_ID": "mock"}):
        r = client.post(f"/tickets/{created['id']}/analyze")
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in {"bug", "feature", "question", "access", "infrastructure", "uncategorized"}
    assert data["priority"] in {"low", "medium", "high", "critical"}
    assert data["ai_suggestion"] is not None

# --- DMBRD-14: Manuelle Prioritaetsaenderung ---

def test_patch_priority_success():
    """PATCH /tickets/{id}/priority aendert die Prioritaet erfolgreich."""
    created = client.post("/tickets", json={"title": "Prio PATCH Test", "description": "Desc"}).json()
    assert created["priority"] == "medium"

    r = client.patch(
        f"/tickets/{created['id']}/priority",
        json={"priority": "high", "changed_by": "Projektmanager"},
        headers={"x-user-role": "manager"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["priority"] == "high"
    assert data["id"] == created["id"]

def test_patch_priority_all_valid_values():
    """Alle gueltigen Prioritaetswerte koennen gesetzt werden."""
    created = client.post("/tickets", json={"title": "All Prios", "description": "Desc"}).json()
    for prio in ["low", "high", "critical", "medium"]:
        r = client.patch(
            f"/tickets/{created['id']}/priority",
            json={"priority": prio, "changed_by": "Tester"},
            headers={"x-user-role": "admin"},
        )
        assert r.status_code == 200
        assert r.json()["priority"] == prio

def test_patch_priority_invalid_value():
    """Ungueltige Prioritaet ergibt HTTP 422."""
    created = client.post("/tickets", json={"title": "Invalid Prio PATCH", "description": "Desc"}).json()
    r = client.patch(
        f"/tickets/{created['id']}/priority",
        json={"priority": "super-critical", "changed_by": "Tester"},
        headers={"x-user-role": "manager"},
    )
    assert r.status_code == 422

def test_patch_priority_not_found():
    """Nicht existierendes Ticket ergibt HTTP 404."""
    r = client.patch(
        "/tickets/99999/priority",
        json={"priority": "high"},
        headers={"x-user-role": "manager"},
    )
    assert r.status_code == 404

def test_patch_priority_forbidden_viewer():
    """Rolle 'viewer' hat keine Berechtigung – HTTP 403."""
    created = client.post("/tickets", json={"title": "Forbidden Prio", "description": "Desc"}).json()
    r = client.patch(
        f"/tickets/{created['id']}/priority",
        json={"priority": "high"},
        headers={"x-user-role": "viewer"},
    )
    assert r.status_code == 403
    assert "Berechtigung" in r.json()["detail"]

def test_patch_priority_forbidden_no_role():
    """Kein Rollen-Header bedeutet keine Berechtigung – HTTP 403."""
    created = client.post("/tickets", json={"title": "No Role Prio", "description": "Desc"}).json()
    r = client.patch(
        f"/tickets/{created['id']}/priority",
        json={"priority": "critical"},
    )
    assert r.status_code == 403

def test_patch_priority_admin_role():
    """Rolle 'admin' darf Prioritaet aendern."""
    created = client.post("/tickets", json={"title": "Admin Prio", "description": "Desc"}).json()
    r = client.patch(
        f"/tickets/{created['id']}/priority",
        json={"priority": "critical"},
        headers={"x-user-role": "admin"},
    )
    assert r.status_code == 200
    assert r.json()["priority"] == "critical"

def test_patch_priority_projectmanager_role():
    """Rolle 'projectmanager' darf Prioritaet aendern."""
    created = client.post("/tickets", json={"title": "PM Prio", "description": "Desc"}).json()
    r = client.patch(
        f"/tickets/{created['id']}/priority",
        json={"priority": "low", "changed_by": "Projektmanager Mueller"},
        headers={"x-user-role": "projectmanager"},
    )
    assert r.status_code == 200
    assert r.json()["priority"] == "low"

def test_patch_priority_creates_audit_log():
    """Nach der Prioritaetsaenderung wird ein Audit-Log-Eintrag erzeugt."""
    created = client.post("/tickets", json={"title": "Audit Log Test", "description": "Desc"}).json()
    ticket_id = created["id"]

    client.patch(
        f"/tickets/{ticket_id}/priority",
        json={"priority": "critical", "changed_by": "Max Mustermann"},
        headers={"x-user-role": "manager"},
    )

    log_r = client.get(f"/tickets/{ticket_id}/change-log")
    assert log_r.status_code == 200
    log = log_r.json()
    assert len(log) >= 1
    entry = log[0]
    assert entry["field"] == "priority"
    assert entry["old_value"] == "medium"
    assert entry["new_value"] == "critical"
    assert entry["changed_by"] == "Max Mustermann"
    assert "changed_at" in entry

def test_patch_priority_audit_log_multiple_changes():
    """Mehrere Prioritaetsaenderungen erzeugen mehrere Audit-Log-Eintraege."""
    created = client.post("/tickets", json={"title": "Multi Audit", "description": "Desc"}).json()
    ticket_id = created["id"]

    for prio in ["high", "critical", "low"]:
        client.patch(
            f"/tickets/{ticket_id}/priority",
            json={"priority": prio, "changed_by": "Tester"},
            headers={"x-user-role": "admin"},
        )

    log_r = client.get(f"/tickets/{ticket_id}/change-log")
    assert log_r.status_code == 200
    assert len(log_r.json()) == 3

def test_get_change_log_not_found():
    """Change-Log fuer nicht existierendes Ticket ergibt HTTP 404."""
    r = client.get("/tickets/99999/change-log")
    assert r.status_code == 404

def test_get_change_log_empty():
    """Neu erstelltes Ticket hat leeren Change-Log."""
    created = client.post("/tickets", json={"title": "Empty Log", "description": "Desc"}).json()
    r = client.get(f"/tickets/{created['id']}/change-log")
    assert r.status_code == 200
    assert r.json() == []

def test_patch_priority_updates_list_view():
    """Nach dem PATCH erscheint die neue Prioritaet in der Listenansicht."""
    created = client.post("/tickets", json={"title": "List View Test", "description": "Desc"}).json()
    ticket_id = created["id"]

    client.patch(
        f"/tickets/{ticket_id}/priority",
        json={"priority": "critical"},
        headers={"x-user-role": "manager"},
    )

    # Listenansicht pruefen
    list_r = client.get("/tickets")
    ticket_in_list = next(t for t in list_r.json() if t["id"] == ticket_id)
    assert ticket_in_list["priority"] == "critical"

    # Detailansicht pruefen
    detail_r = client.get(f"/tickets/{ticket_id}")
    assert detail_r.json()["priority"] == "critical"
