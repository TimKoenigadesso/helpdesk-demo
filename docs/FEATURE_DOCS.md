# Feature: Melder kann Namen bei Meldung angeben (AGSDLC-17)

## Was wurde implementiert

- **Optionales Namensfeld im Ticket-Formular**: Mitarbeitende können beim Erstellen eines Tickets ihren Vor- und Nachnamen angeben (max. 100 Zeichen); das Feld ist nicht verpflichtend.
- **Backend-Validierung & Bereinigung**: `reporter_name` wird per Pydantic auf max. 100 Zeichen begrenzt; reine Whitespace-Eingaben werden serverseitig zu `null` normalisiert (`strip()`-Logik in `POST /tickets`).
- **Persistente DB-Speicherung**: Die SQLite-Tabelle `tickets` wurde um die nullable Spalte `reporter_name TEXT` erweitert; das Schema-Update erfolgt via `ALTER TABLE … ADD COLUMN` in `init_db()` (additive Migration, kein Datenverlust).
- **Anzeige in Ticket-Liste & Admin-Dashboard**: Ist ein Name vorhanden, wird er unterhalb der Beschreibung mit einem Person-Icon als „Gemeldet von: \<Name\>" dargestellt – sowohl in der Mitarbeiter- als auch in der Admin-Ansicht.
- **TypeScript-API-Typ aktualisiert**: Das Interface `Ticket` und die Signatur von `api.createTicket()` wurden um `reporter_name` ergänzt, sodass das Frontend typsicher mit dem neuen Feld arbeitet.

## Neue API-Endpunkte

Es wurden keine neuen Endpunkte eingeführt. Der bestehende Endpunkt wurde um ein optionales Request-/Response-Feld erweitert:

| Methode | Pfad       | Beschreibung                              | Parameter (Body / Response)                                                                                                   |
|---------|------------|-------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `POST`  | `/tickets` | Erstellt ein neues Ticket (erweitert)     | **Body (neu):** `reporter_name?: string \| null` – optionaler Meldername, max. 100 Zeichen; Whitespace-only → `null`          |
| `GET`   | `/tickets` | Gibt alle Tickets zurück (erweitert)      | **Response (neu):** Jedes Ticket-Objekt enthält `reporter_name: string \| null`                                               |
| `GET`   | `/tickets/{id}` | Gibt ein einzelnes Ticket zurück (erweitert) | **Response (neu):** Ticket-Objekt enthält `reporter_name: string \| null`                                                |

## Tests

### Backend – `backend/tests/test_api.py` (8 neue Unit-Tests)

| Testname | Was wird geprüft |
|---|---|
| `test_create_ticket_with_reporter_name` | Name wird korrekt gespeichert und in der Response zurückgegeben (`201`) |
| `test_create_ticket_without_reporter_name` | Fehlendes Feld liefert `reporter_name: null` – kein Fehler |
| `test_reporter_name_max_length_exceeded` | Name > 100 Zeichen wird von Pydantic mit `422 Unprocessable Entity` abgelehnt |
| `test_reporter_name_exactly_100_chars` | Genau 100 Zeichen sind gültig und werden unverändert gespeichert |
| `test_reporter_name_whitespace_only_stored_as_none` | Nur-Leerzeichen-Eingabe wird serverseitig zu `null` normalisiert |
| `test_reporter_name_visible_in_detail` | Gespeicherter Name ist über `GET /tickets/{id}` abrufbar |
| `test_reporter_name_visible_in_list` | Gespeicherter Name erscheint in `GET /tickets` |
| `test_reporter_name_trimmed` | Führende/nachfolgende Leerzeichen werden vor der Speicherung entfernt |

### Frontend – `frontend/tests/helpdesk.spec.ts` (5 neue E2E-Tests via Playwright)

| Testname | Was wird geprüft |
|---|---|
| `Namensfeld ist im Formular sichtbar und hat korrekten Platzhalter` | Input-Element mit `data-testid="ticket-reporter-name"` ist sichtbar und hat Placeholder „Vor- und Nachname" |
| `Ticket mit Name erstellen – Name wird in der Liste angezeigt` | Nach dem Absenden erscheint „Gemeldet von: Maria Testerin" in der Ticket-Karte |
| `Ticket ohne Name erstellen – kein Namens-Display wird gezeigt` | `ticket-reporter-name-display` ist **nicht** sichtbar, wenn kein Name angegeben wurde |
| `Namensfeld wird nach dem Absenden zurückgesetzt` | Eingabefeld ist nach erfolgreichem Submit wieder leer |
| `Name ist im Admin-Dashboard sichtbar` | Nach Wechsel in die Admin-Ansicht ist der Meldername ebenfalls in der Ticket-Karte sichtbar |

## Deployment-Hinweise

### Datenbank-Migration
- **Automatisch, additive Migration**: `init_db()` führt beim Start `ALTER TABLE tickets ADD COLUMN reporter_name TEXT` aus.
- Ein bereits laufendes System mit bestehenden Tickets benötigt **keinen manuellen Migrationsschritt** – vorhandene Datensätze erhalten den Wert `NULL`, was dem Standardverhalten entspricht.
- **Kein Rollback-Risiko**: Da die Spalte nullable ist, bleibt die Applikation auch ohne Neustart abwärtskompatibel.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine – das Feature nutzt ausschließlich bereits vorhandene Bibliotheken (FastAPI/Pydantic, React, Playwright).

### Hinweise für QA / Abnahme
- Feldlänge clientseitig über `maxLength={100}` am Input sowie über eine React-State-Validierung abgesichert; serverseitig zusätzlich über Pydantic `Field(max_length=100)`.
- Der Name wird ausschließlich angezeigt, wenn `reporter_name !== null`; es gibt keine Fallback-Darstellung.
