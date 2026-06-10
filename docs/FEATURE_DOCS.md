# Feature: Manuelle Prioritätsänderung mit Audit-Log (DMBRD-14)

## Was wurde implementiert

- **RBAC-gesicherter PATCH-Endpunkt** (`PATCH /tickets/{id}/priority`): Erlaubt es berechtigten Rollen (`admin`, `manager`, `projectmanager`), die Priorität eines Tickets manuell zu überschreiben – unabhängig von der KI-Analyse.
- **Audit-Log via `change_log`-Tabelle**: Jede Prioritätsänderung wird unveränderlich protokolliert (Felder: altes/neues Wert, ausführende Person, Zeitstempel). Der Log ist über `GET /tickets/{id}/change-log` abrufbar.
- **`PrioritySelector`-Komponente (Frontend)**: Ersetzt den bisherigen statischen `PriorityBadge` durch ein interaktives Inline-Edit-Widget mit Bleistift-Icon, Dropdown, Speichern/Abbrechen-Buttons und Dirty-Check-Dialog.
- **Berechtigungsfeedback im UI**: Rollen ohne Schreibrecht (`viewer`) sehen ein Schloss-Icon statt des Bleistift-Icons; ein Inline-Hinweis erklärt die fehlende Berechtigung.
- **Neues Pydantic-Modell `PriorityUpdate`** im Backend sowie `ChangeLogEntry` für typsichere Request-Bodies und API-Responses.

## Neue API-Endpunkte

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `PATCH` | `/tickets/{ticket_id}/priority` | Ändert die Priorität eines Tickets; schreibt Audit-Log-Eintrag | **Path:** `ticket_id: int` · **Body:** `priority: str` (low/medium/high/critical), `changed_by?: str` · **Header:** `x-user-role: str` (admin/manager/projectmanager erforderlich) |
| `GET` | `/tickets/{ticket_id}/change-log` | Gibt alle Audit-Log-Einträge eines Tickets zurück (absteigende Zeitreihe) | **Path:** `ticket_id: int` |

**HTTP-Statuscodes `PATCH`:**

| Code | Bedeutung |
|------|-----------|
| `200` | Priorität erfolgreich geändert, gibt aktualisiertes `Ticket`-Objekt zurück |
| `403` | Fehlende oder unzureichende Rolle (`viewer` / kein Header) |
| `404` | Ticket nicht gefunden |
| `422` | Ungültiger Prioritätswert |

## Tests

### Backend – `backend/tests/test_api.py` (12 neue Tests)

| Test | Was wird geprüft |
|------|-----------------|
| `test_patch_priority_success` | Erfolgreiche Prioritätsänderung durch Manager; Response enthält neue Priorität |
| `test_patch_priority_all_valid_values` | Alle vier erlaubten Werte (`low`, `medium`, `high`, `critical`) sind setzbar |
| `test_patch_priority_invalid_value` | Ungültiger Wert (`super-critical`) liefert HTTP 422 |
| `test_patch_priority_not_found` | Nicht existierendes Ticket liefert HTTP 404 |
| `test_patch_priority_forbidden_viewer` | Rolle `viewer` liefert HTTP 403 mit passendem Fehlertext |
| `test_patch_priority_forbidden_no_role` | Fehlender Header liefert HTTP 403 |
| `test_patch_priority_admin_role` | Rolle `admin` darf Priorität ändern |
| `test_patch_priority_projectmanager_role` | Rolle `projectmanager` darf Priorität ändern |
| `test_patch_priority_creates_audit_log` | Audit-Log-Eintrag enthält korrekte `old_value`/`new_value`/`changed_by`-Felder |
| `test_patch_priority_audit_log_multiple_changes` | Drei aufeinanderfolgende Änderungen erzeugen exakt drei Log-Einträge |
| `test_get_change_log_not_found` | Change-Log für ungültige Ticket-ID liefert HTTP 404 |
| `test_get_change_log_empty` | Neu erstelltes Ticket hat leeren Change-Log (`[]`) |
| `test_patch_priority_updates_list_view` | Nach PATCH erscheint neue Priorität sowohl in `GET /tickets` als auch in `GET /tickets/{id}` |

### Frontend – `frontend/tests/helpdesk.spec.ts` (6 neue Playwright-Tests)

| Test | Was wird geprüft |
|------|-----------------|
| `Prioritäts-Badge ist sichtbar` | `data-testid="priority-badge"` ist nach Ticket-Erstellung sichtbar |
| `Editor öffnet sich per Bleistift-Klick` | Klick auf `priority-edit-btn` blendet `priority-select`, `priority-save` und `priority-cancel` ein |
| `Priorität auf Hoch ändern und speichern` | Dropdown-Auswahl `high` + Speichern → Badge zeigt „Hoch" |
| `Abbrechen mit Dirty-Check-Dialog (Dismiss)` | Ungespeicherte Änderung + Cancel → Bestätigungsdialog → `dismiss()` → Editor bleibt offen |
| `Bestätigungsdialog bestätigen verwirft Änderung` | Ungespeicherte Änderung + Cancel → `accept()` → Editor schließt, Badge zeigt wieder „Mittel" |
| `Abbrechen ohne Änderung zeigt keinen Dialog` | Sofortiges Abbrechen ohne Wertänderung löst keinen Browser-Dialog aus |

## Deployment-Hinweise

### Datenbank-Migration
Die neue Tabelle `change_log` wird beim Start automatisch via `init_db()` angelegt (`CREATE TABLE IF NOT EXISTS`). **Kein manueller Migrations-Schritt notwendig** – bestehende Datenbanken werden beim nächsten Anwendungsstart erweitert.

```sql
CREATE TABLE IF NOT EXISTS change_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id   INTEGER NOT NULL,
    field       TEXT    NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_by  TEXT    NOT NULL DEFAULT 'system',
    changed_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
```

### Neue Umgebungsvariablen
Keine neuen Umgebungsvariablen erforderlich.

### Rollen-Header
Der Header `x-user-role` wird **nicht** durch ein Auth-System gesetzt – dies ist bewusst eine Demo-Implementierung. In einer Produktionsumgebung muss dieser Header durch ein vorgelagertes API-Gateway oder ein JWT-Claim ersetzt werden.

### Neue Abhängigkeiten
Keine neuen Python- oder NPM-Pakete. Das Feature nutzt ausschließlich bereits vorhandene Bibliotheken (`FastAPI`, `React`, `Playwright`).

### Frontend-Rollenermittlung
Die Benutzerrolle wird im Frontend aus `localStorage.getItem('userRole')` gelesen (Demo-Default: `'manager'`). Für den Produktionseinsatz muss dies durch einen Auth-Context (z. B. OIDC/JWT) ersetzt werden.
