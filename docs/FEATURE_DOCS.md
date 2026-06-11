# Feature: Ticket-Prioritätsfunktion [AGSDLC-6]

## Was wurde implementiert

- **Prioritätsstufen-Modell:** Vier Stufen (`low`, `medium`, `high`, `critical`) wurden end-to-end eingeführt — vom Datenmodell über die API bis zur UI.
- **Backend-Validierung & Fallback:** `POST /tickets` akzeptiert ein optionales `priority`-Feld; ungültige Werte werden serverseitig auf `medium` zurückgesetzt, fehlende Werte ebenfalls.
- **Prioritäts-Auswahl im Formular:** `TicketForm` enthält ein neues Dropdown (`data-testid="ticket-priority"`) mit Standardwert `medium`; der gewählte Wert wird beim Erstellen und nach dem Reset korrekt mitgesendet.
- **Visuelle Darstellung in der Ticketliste:** `TicketList` zeigt je Ticket einen farbcodierten Priority-Dot und ein `PriorityBadge`. Kritische, offene Tickets erhalten zusätzlich roten Border/Ring/Hintergrund sowie ein prominentes Warn-Banner (`data-testid="critical-banner"`).
- **API-Typ-Erweiterung:** `api.createTicket()` in `api.ts` akzeptiert nun das optionale Feld `priority?: string`.

## Neue API-Endpunkte

Kein neuer Endpunkt — bestehender Endpunkt wurde erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen | `title: str` (required), `description: str` (required), `priority?: str` (optional, Default: `"medium"`, gültig: `low` \| `medium` \| `high` \| `critical`) |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren | `priority?: str` — Priorität nachträglich ändern (bereits vor diesem Feature vorhanden, jetzt vollständig getestet) |
| `GET` | `/tickets` | Ticket-Liste | Antwort enthält jetzt für jedes Ticket das Feld `priority` |
| `GET` | `/tickets/{id}` | Ticket-Detail | Antwort enthält jetzt das Feld `priority` |

## Tests

### Backend — `backend/tests/test_api.py` (11 neue Unit-Tests)

| Testname | Was wird geprüft |
|---|---|
| `test_create_ticket_with_priority_low/medium/high/critical` | Alle vier gültigen Prioritätswerte werden korrekt gespeichert und in der Response zurückgegeben (HTTP 201). |
| `test_create_ticket_default_priority_is_medium` | Fehlendes `priority`-Feld führt automatisch zu `"medium"`. |
| `test_create_ticket_invalid_priority_falls_back_to_medium` | Ungültiger Wert (z. B. `"extreme"`) wird serverseitig auf `"medium"` normiert. |
| `test_priority_visible_in_list` | Gespeicherte Priorität erscheint in `GET /tickets`. |
| `test_priority_visible_in_detail` | Gespeicherte Priorität erscheint in `GET /tickets/{id}`. |
| `test_update_priority_low_to_critical` | Priorität lässt sich per `PUT` hochsetzen. |
| `test_update_priority_critical_to_low` | Priorität lässt sich per `PUT` runtersetzen. |
| `test_all_priority_values_are_valid` | Parametrisierter Smoke-Test aller vier Stufen in einem Durchlauf. |

### Frontend E2E — `frontend/tests/helpdesk.spec.ts` (6 neue Playwright-Tests)

| Testname | Was wird geprüft |
|---|---|
| `Prioritäts-Dropdown ist im Formular sichtbar und hat Standardwert Mittel` | Dropdown sichtbar, Default-Wert `medium`. |
| `Alle vier Prioritätsstufen sind im Dropdown wählbar` | Optionen `low/medium/high/critical` mit korrekten Labels vorhanden. |
| `Ticket mit Priorität Hoch erstellen und Badge prüfen` | Nach Submit zeigt das Ticket-Item den Text `"Hoch"` via `PriorityBadge`. |
| `Ticket mit Priorität Niedrig erstellen und Badge prüfen` | Entsprechend `"Niedrig"`. |
| `Ticket mit Priorität Kritisch wird visuell hervorgehoben` | `data-testid="critical-banner"` sichtbar, Badge zeigt `"Kritisch"`. |
| `Ohne manuelle Auswahl wird Priorität Mittel gesetzt` | Default-Verhalten: Badge zeigt `"Mittel"`. |

## Deployment-Hinweise

> **⚠️ DB-Migration erforderlich**, falls die Produktions-Datenbank bereits Tickets ohne `priority`-Spalte enthält.

### Datenbank

Die Tabelle `tickets` benötigt die Spalte `priority`. Bei bestehenden Deployments folgendes SQL ausführen:

```sql
ALTER TABLE tickets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';
```

Bei Nutzung des automatischen Schema-Setups (SQLite `CREATE TABLE IF NOT EXISTS`) reicht ein Neustart mit dem aktuellen `main.py`/`models.py`, sofern die DB noch leer ist — andernfalls ist das manuelle Alter-Statement notwendig.

### Neue Umgebungsvariablen

Keine.

### Neue Abhängigkeiten

Keine neuen Packages — alle Änderungen nutzen ausschließlich bereits installierte Libraries (`FastAPI`, `Pydantic`, `React`, `Playwright`).

### Seed-Daten

Falls der Demo-Reset-Endpoint (`POST /reset`) genutzt wird: Seed-Daten sollten um das Feld `priority` ergänzt werden, damit repräsentative Beispieldaten für alle Stufen vorhanden sind.
