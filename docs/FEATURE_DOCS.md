# Feature: P0–P4 Ticketpriorität (AGSDLC-36)

## Was wurde implementiert

- **Neues Datenbankfeld `ticket_priority`** – Die Tabelle `tickets` erhält via `ALTER TABLE` eine optionale Spalte `TEXT` für P0–P4-Werte; bestehende Datensätze behalten `NULL` als Standardwert (non-breaking Migration).
- **Backend-Validierung** – `VALID_TICKET_PRIORITIES = {"P0", "P1", "P2", "P3", "P4"}` in `models.py`; beim Erstellen werden ungültige Werte stillschweigend auf `None` zurückgesetzt, beim Update mit PATCH liefert ein ungültiger Wert HTTP 422.
- **API-Erweiterung** – `POST /tickets` und `PUT /tickets/{id}` akzeptieren das optionale Feld `ticket_priority`; alle Ticket-Endpunkte geben den Wert in der Response zurück.
- **Frontend-Formular** – `TicketForm` erhält ein eigenes P0–P4-Dropdown (`data-testid="ticket-priority-level"`) mit farbkodierter Legende (`data-testid="priority-legend"`) und einem Hover-/Focus-Tooltip (`data-testid="priority-tooltip"`) mit Stufenbeschreibungen.
- **UI-Darstellung** – `TicketList` zeigt die neue `TicketPriorityBadge`-Komponente (farbkodiert P0 rot → P4 grau) neben dem bestehenden `PriorityBadge`; Tickets mit `ticket_priority === "P0"` lösen – wie `priority === "critical"` – das rote Kritisch-Banner aus.

---

## Neue API-Endpunkte

> Bestehende Endpunkte wurden um das Feld `ticket_priority` erweitert. Es gibt keinen neuen eigenständigen Endpunkt; die Änderungen sind vollständig abwärtskompatibel (optionales Feld).

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen (inkl. optionaler P0–P4-Priorität) | Body: `ticket_priority?: "P0"\|"P1"\|"P2"\|"P3"\|"P4"\|null` |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren (inkl. P0–P4-Priorität änderbar) | Body: `ticket_priority?: "P0"\|"P1"\|"P2"\|"P3"\|"P4"` – Ungültiger Wert → HTTP 422 |
| `GET` | `/tickets` | Ticketliste (liefert `ticket_priority` je Ticket) | – |
| `GET` | `/tickets/{id}` | Ticketdetail (liefert `ticket_priority`) | Path: `id: int` |

---

## Tests

### Backend – `backend/tests/test_api.py` (13 neue Unit-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_create_ticket_without_ticket_priority_defaults_to_none` | Fehlendes Feld → Response enthält `ticket_priority: null` |
| `test_create_ticket_with_ticket_priority_p0` … `p4` (5 Tests) | Jede einzelne Stufe P0–P4 wird korrekt gespeichert und zurückgegeben |
| `test_create_ticket_all_five_ticket_priorities` | Alle fünf Stufen in einer Schleife – Smoke-Test für Vollständigkeit |
| `test_create_ticket_invalid_ticket_priority_falls_back_to_none` | Ungültiger Wert (`"P99"`) beim Erstellen → `null`, kein Fehler |
| `test_ticket_priority_visible_in_detail` | `ticket_priority` ist in `GET /tickets/{id}` sichtbar |
| `test_ticket_priority_visible_in_list` | `ticket_priority` ist in `GET /tickets` sichtbar |
| `test_update_ticket_priority_level` | P3 → P0 via `PUT` – Update wird korrekt persistiert |
| `test_update_ticket_invalid_ticket_priority_returns_422` | Ungültiger Wert beim Update → HTTP 422 |
| `test_ticket_priority_independent_of_priority_field` | `ticket_priority` (P0–P4) und `priority` (low–critical) sind unabhängig voneinander |

### Frontend (E2E) – `frontend/tests/helpdesk.spec.ts` (9 neue Playwright-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `P0–P4 Dropdown ist im Formular sichtbar mit Standardwert leer` | Select vorhanden, Standardwert ist `""` |
| `Alle fünf P-Stufen sind im Dropdown wählbar` | Options P0–P4 sind im DOM vorhanden |
| `Prioritäts-Legende ist im Formular sichtbar` | `data-testid="priority-legend"` wird gerendert |
| `Tooltip-Button ist sichtbar und zeigt Tooltip bei Hover` | Hover auf `?`-Button → Tooltip erscheint |
| `Ticket mit P0-Priorität erstellen — Badge und Banner sichtbar` | P0-Badge + Kritisch-Banner werden nach dem Submit angezeigt |
| `Ticket mit P1-Priorität erstellen — Badge sichtbar` | P1-Badge korrekt dargestellt |
| `Ticket mit P4-Priorität erstellen — Badge sichtbar, kein Kritisch-Banner` | P4-Badge vorhanden, Banner bleibt aus |
| `Ticket ohne P-Level-Auswahl kann trotzdem erstellt werden (Feld optional)` | Submit ohne Auswahl erfolgreich; kein Badge gerendert |
| `P0-Priorität hat kein required-Attribut (optional)` | Select-Element besitzt kein `required`-Attribut |

---

## Deployment-Hinweise

### Datenbank-Migration
- **Automatisch / non-breaking:** `database.py` führt beim Start `ALTER TABLE tickets ADD COLUMN ticket_priority TEXT` via `try/except` aus. Schlägt die Anweisung fehl (Spalte existiert bereits), wird der Fehler ignoriert. **Kein manueller Migrationsschritt erforderlich.**
- Bestehende Tickets erhalten automatisch `ticket_priority = NULL`.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine neuen Pakete – die Änderungen nutzen ausschließlich bestehende Backend- (FastAPI, SQLite) und Frontend-Bibliotheken (React, Tailwind CSS).

### Hinweise für den Rollout
- Das Feature ist vollständig **abwärtskompatibel**: Clients, die `ticket_priority` nicht senden, sind nicht betroffen.
- **P0-Tickets** erhalten dasselbe visuelle Kritisch-Highlighting wie `priority=critical`-Tickets – dies ist bewusstes Produktverhalten.
- Das Feld ist im Formular als optional gekennzeichnet (`* `-Label ist rein visuell; kein `required`-Attribut gesetzt), um bestehende Workflows nicht zu unterbrechen.
