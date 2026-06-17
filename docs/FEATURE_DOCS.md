# Feature: Melder-Identifikation via `reporter_name` (AGSDLC-17)

## Was wurde implementiert

- **Optionales Namensfeld im Ticket-Formular** – Nutzer können beim Erstellen eines Tickets ihren Namen angeben (max. 100 Zeichen), um direkte Rückfragen zu ermöglichen.
- **Backend-Validierung & Persistenz** – Das neue Feld `reporter_name` wird in der SQLite-Datenbank als nullable `TEXT`-Spalte gespeichert; leere oder rein aus Whitespace bestehende Eingaben werden serverseitig auf `null` normiert.
- **Pydantic-Modelle erweitert** – `TicketCreate`, `TicketUpdate` und `Ticket` besitzen das neue Feld `reporter_name: Optional[str] = Field(None, max_length=100)`; Überschreitung von 100 Zeichen führt zu HTTP 422.
- **Frontend-Darstellung kontextabhängig** – In der User-Ansicht wird der Name als „Von: …" (grau), in der Admin-Ansicht als „Melder: …" (indigo, fett) mit Person-Icon angezeigt; fehlt der Name, wird das Element vollständig ausgeblendet.
- **API-Client-Typ aktualisiert** – Das TypeScript-Interface `Ticket` und die Funktion `createTicket` wurden um `reporter_name` ergänzt, sodass der gesamte Datenfluss Frontend → Backend typsicher ist.

---

## Neue API-Endpunkte

Die bestehenden Endpunkte wurden **erweitert** (kein neuer Pfad); das Feld `reporter_name` ist in allen relevanten Requests und Responses verfügbar.

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen | Body (JSON): `title` *(str, required)*, `description` *(str, required)*, `reporter_name` *(str \| null, optional, max 100 Zeichen)* |
| `GET` | `/tickets` | Alle Tickets auflisten | – |
| `GET` | `/tickets/{id}` | Einzelnes Ticket abrufen | Path: `id` *(int)* |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren (inkl. Name) | Path: `id` *(int)*; Body (JSON): `reporter_name` *(str \| null, optional, max 100 Zeichen)* |

> **Response-Feld** `reporter_name` ist in allen obigen Responses enthalten (`null` wenn nicht gesetzt).

---

## Tests

### Backend – Unit-/Integrationstests (`backend/tests/test_api.py`)

| Test | Was wird geprüft |
|------|-----------------|
| `test_create_ticket_with_reporter_name` | Ticket mit gültigem Namen → HTTP 201, Name im Response korrekt |
| `test_create_ticket_reporter_name_persisted` | Gespeicherter Name ist via `GET /tickets/{id}` abrufbar |
| `test_create_ticket_reporter_name_in_list` | Name erscheint in der Ticket-Übersicht (`GET /tickets`) |
| `test_create_ticket_without_reporter_name` | Ohne Name → `reporter_name` ist `null` |
| `test_create_ticket_reporter_name_empty_string_treated_as_none` | Whitespace-only-String → serverseitig `null` |
| `test_create_ticket_reporter_name_max_length` | Genau 100 Zeichen → HTTP 201 |
| `test_create_ticket_reporter_name_too_long` | 101 Zeichen → HTTP 422 (Pydantic-Validierung) |
| `test_ticket_response_has_reporter_name_field` | Response-Modell enthält immer das Feld `reporter_name` |
| `test_update_ticket_reporter_name` | `PUT /tickets/{id}` aktualisiert `reporter_name` korrekt |

### Frontend – E2E-Tests (`frontend/tests/helpdesk.spec.ts`, Playwright)

| Test | Was wird geprüft |
|------|-----------------|
| `Namensfeld ist im Meldeformular sichtbar` | Input `[data-testid="reporter-name"]` wird gerendert |
| `Namensfeld hat korrekten Placeholder-Text` | Placeholder enthält „Name" |
| `Ticket mit Name erstellen und Name in Übersicht anzeigen` | Submit → `reporter-name-value` zeigt „Max Mustermann" in der Liste |
| `Ticket ohne Name – kein Namensfeld in der Liste` | `reporter-name-display` ist **nicht** sichtbar bei leerem Namensfeld |
| `Namensfeld wird nach Absenden geleert` | Formular-Reset: alle Felder (inkl. Name) nach Submit leer |
| `Name mit mehr als 100 Zeichen wird im Frontend abgelehnt` | `maxlength="100"`-Attribut am Input vorhanden |
| `Name in Admin-Ansicht sichtbar` | In der 🔧 IT-Admin-Ansicht wird „Melder: Anna Admin" korrekt angezeigt |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Migration erfolgt **automatisch und rückwärtskompatibel** via `ALTER TABLE tickets ADD COLUMN reporter_name TEXT` beim App-Start (`init_db()`). Ein manueller Migrations-Schritt ist **nicht erforderlich**. Bestehende Tickets erhalten `reporter_name = null`.

### Neue Umgebungsvariablen
Keine. Das Feature benötigt keine zusätzlichen Umgebungsvariablen.

### Neue Abhängigkeiten
Keine neuen Pakete. Pydantic `Field` (bereits Bestandteil von FastAPI) wird nun importiert.

### Rollback
Sollte ein Rollback nötig sein, bleibt die `reporter_name`-Spalte in der DB erhalten, wird aber von der Vorgänger-Version schlicht ignoriert – kein Datenverlust, keine Inkompatibilität.
