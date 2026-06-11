# Feature: Prioritätsfeld im Ticket-Melde-Formular (AGSDLC-5)

## Was wurde implementiert

- **Backend – Datenmodell** (`backend/models.py`): `TicketCreate` erhält das optionale Feld `priority: Optional[str] = "medium"`; fehlende Angabe wird automatisch auf `"medium"` gesetzt.
- **Backend – Validierung & Persistenz** (`backend/main.py`): `POST /tickets` prüft den übergebenen Prioritätswert gegen `VALID_PRIORITIES` (`low | medium | high | critical`); ungültige Werte werden mit **HTTP 422** abgelehnt. Der Wert wird in der SQLite-Spalte `priority` gespeichert.
- **Frontend – API-Client** (`frontend/src/api.ts`): `createTicket()` akzeptiert nun das optionale Feld `priority?: string` und übermittelt es im Request-Body.
- **Frontend – Formular** (`frontend/src/components/TicketForm.tsx`): Neues `<select>`-Dropdown mit vier Prioritätsstufen (🟢 Niedrig / 🟡 Mittel / 🟠 Hoch / 🔴 Kritisch), jeweils mit Kurzbeschreibung; Standardwert `medium`; nach erfolgreichem Absenden wird das Dropdown auf `medium` zurückgesetzt; client-seitige Fehleranzeige bei fehlendem Wert via `data-testid="priority-error"`.
- **Tests** (`backend/tests/test_api.py`, `frontend/tests/helpdesk.spec.ts`): 11 neue Backend-Unit-Tests und 7 neue E2E-Tests decken alle Prioritätswerte, Standardwert-Logik, Validierungsabweisung, Persistenz, Update-Verhalten und Formular-Reset ab.

---

## Neue API-Endpunkte

Es wurden **keine neuen Endpunkte** eingeführt. Der bestehende Endpunkt wurde um den Parameter `priority` erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen *(geändert)* | `title: str`, `description: str`, **`priority?: "low"\|"medium"\|"high"\|"critical"` (Default: `"medium"`)** |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren *(geändert)* | `priority?: "low"\|"medium"\|"high"\|"critical"` – alle vier Werte werden akzeptiert; ungültige Werte → HTTP 422 |

---

## Tests

### Backend – `backend/tests/test_api.py` (11 neue Tests)

| Testname | Was wird geprüft |
|---|---|
| `test_create_ticket_with_priority_low` | Ticket mit `priority=low` wird mit Status 201 und korrektem Wert angelegt |
| `test_create_ticket_with_priority_high` | Ticket mit `priority=high` wird korrekt gespeichert |
| `test_create_ticket_with_priority_critical` | Ticket mit `priority=critical` wird korrekt gespeichert |
| `test_create_ticket_with_priority_medium_explicit` | Explizites `priority=medium` wird akzeptiert |
| `test_create_ticket_default_priority_is_medium` | Fehlendes Prioritätsfeld → Standardwert `medium` |
| `test_create_ticket_invalid_priority_rejected` | Ungültiger Wert (`"super-ultra"`) → HTTP 422 |
| `test_priority_persisted_and_visible_in_list` | Priorität ist nach `POST` in `GET /tickets` sichtbar |
| `test_priority_persisted_and_readable_via_get` | Priorität ist per `GET /tickets/{id}` abrufbar |
| `test_priority_update_all_valid_values` | Alle vier gültigen Werte sind per `PUT` aktualisierbar |
| `test_priority_update_invalid_value_rejected` | Ungültiger Wert bei `PUT` → HTTP 422 |
| `test_priority_unchanged_after_status_update` | Statusänderung via `PUT` überschreibt Priorität **nicht** |

### Frontend – `frontend/tests/helpdesk.spec.ts` (7 neue E2E-Tests, Playwright)

| Testname | Was wird geprüft |
|---|---|
| `Prioritäts-Dropdown ist im Formular sichtbar` | `[data-testid="ticket-priority"]` ist auf der Seite sichtbar |
| `Prioritäts-Dropdown hat Standardwert "medium"` | Dropdown startet mit `value="medium"` |
| `Alle vier Prioritätswerte sind als Optionen vorhanden` | `low`, `medium`, `high`, `critical` sind im DOM |
| `Ticket mit Priorität "low" erstellen und in der Liste anzeigen` | PriorityBadge zeigt „Niedrig" nach Ticket-Erstellung |
| `Ticket mit Priorität "critical" erstellen und in der Liste anzeigen` | PriorityBadge zeigt „Kritisch" nach Ticket-Erstellung |
| `Ticket mit Priorität "high" erstellen und in der Liste anzeigen` | PriorityBadge zeigt „Hoch" nach Ticket-Erstellung |
| `Priorität bleibt nach Formular-Reset auf Standardwert "medium"` | Nach Absenden springt Dropdown zurück auf `medium` |
| `Prioritäts-Dropdown ist nach Ticket-Erstellung wieder auf "medium" zurückgesetzt` | Bestätigung via Erfolgsmeldung + Dropdown-Wert |

---

## Deployment-Hinweise

### Datenbank-Migration
Die SQLite-Spalte `priority` muss in bestehenden Datenbanken vorhanden sein.  
Sofern die DB via Auto-Migration / `CREATE TABLE IF NOT EXISTS` verwaltet wird, greift dies beim nächsten Start automatisch. Bei Produktiv-Datenbanken mit vorhandenen Tickets folgenden SQL-Befehl manuell ausführen:

```sql
ALTER TABLE tickets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';
```

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine zusätzlichen Packages – weder im Backend (`requirements.txt`) noch im Frontend (`package.json`).

### Rückwärtskompatibilität
- Alle bestehenden API-Clients, die `priority` **nicht** mitsenden, erhalten weiterhin einen gültigen Response (Defaultwert `"medium"` greift serverseitig).
- Vorhandene Tickets ohne `priority`-Wert erhalten durch das `DEFAULT 'medium'` in der Migration automatisch einen gültigen Wert.
