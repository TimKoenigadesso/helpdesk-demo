# Feature: Reporter-Name-Feld für Ticketmelder (AGSDLC-30)

## Was wurde implementiert

- **Neues Datenbankfeld `reporter_name`** – Die Tabelle `tickets` wurde um eine optionale Freitextspalte erweitert, die den vollständigen Namen des Ticketmelders als einzelnes Feld speichert (Alternative zu den bestehenden `first_name`/`last_name`-Feldern).
- **Backend-Validierung** – `reporter_name` ist auf maximal 100 Zeichen begrenzt (Konstante `REPORTER_NAME_MAX_LENGTH = 100`); führende/nachfolgende Leerzeichen werden serverseitig gestrippt; Überschreitung wird mit HTTP 422 abgelehnt – sowohl beim Anlegen (`POST`) als auch beim Aktualisieren (`PUT`).
- **Pydantic-Modelle erweitert** – `TicketCreate`, `TicketUpdate` und `Ticket` enthalten das neue Feld `reporter_name` mit korrekten Defaults (`""` / `None`) und `max_length`-Constraints.
- **Frontend-Integration** – `TicketForm` zeigt ein neues optionales Eingabefeld inkl. clientseitiger Längenvalidierung und Inline-Fehlermeldung; `TicketList` stellt `reporter_name` priorisiert gegenüber `first_name`/`last_name` dar (`data-testid="ticket-reporter-name-display"`).
- **TypeScript-API-Typ aktualisiert** – Interface `Ticket` und die `createTicket`-Signatur in `api.ts` wurden um `reporter_name` ergänzt, sodass der gesamte Frontend-Datenpfad typsicher ist.

---

## Neue API-Endpunkte

Es wurden keine neuen Routen eingeführt. Die bestehenden Endpunkte wurden um das Feld `reporter_name` erweitert:

| Methode | Pfad | Beschreibung | Parameter (neu) |
|---------|------|--------------|-----------------|
| `POST` | `/tickets` | Ticket anlegen | `reporter_name` *(optional, string, max. 100 Zeichen)* |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren | `reporter_name` *(optional, string, max. 100 Zeichen)* |
| `GET` | `/tickets` | Alle Tickets abrufen | – (Antwort enthält jetzt `reporter_name`) |
| `GET` | `/tickets/{id}` | Einzelnes Ticket abrufen | – (Antwort enthält jetzt `reporter_name`) |

**Request-Beispiel:**
```json
POST /tickets
{
  "title": "Login schlägt fehl",
  "description": "Kann mich nicht einloggen.",
  "priority": "high",
  "reporter_name": "Maria Musterfrau"
}
```

**Response (201 Created):**
```json
{
  "id": 42,
  "title": "Login schlägt fehl",
  "reporter_name": "Maria Musterfrau",
  ...
}
```

**Fehler bei Überschreitung (422 Unprocessable Entity):**
```json
{
  "detail": "reporter_name darf maximal 100 Zeichen enthalten."
}
```

---

## Tests

### Backend – `backend/tests/test_api.py` (10 neue Unit-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_create_ticket_with_reporter_name` | `reporter_name` wird korrekt gespeichert und in der Antwort zurückgegeben |
| `test_create_ticket_without_reporter_name_defaults_to_empty` | Default-Wert `""` wenn kein Name übergeben wird |
| `test_reporter_name_max_100_characters_accepted` | Exakt 100 Zeichen werden akzeptiert (HTTP 201) |
| `test_reporter_name_more_than_100_characters_rejected` | 101 Zeichen werden mit HTTP 422 abgelehnt |
| `test_reporter_name_visible_in_detail` | `reporter_name` erscheint im Einzelticket-Endpunkt |
| `test_reporter_name_visible_in_list` | `reporter_name` erscheint in der Übersichtsliste |
| `test_update_ticket_reporter_name` | Nachträgliches Update des Feldes via `PUT` funktioniert |
| `test_update_ticket_reporter_name_too_long_rejected` | Update mit > 100 Zeichen wird mit 422 abgelehnt |
| `test_reporter_name_whitespace_stripped` | Führende/nachfolgende Leerzeichen werden automatisch entfernt |
| `test_reporter_name_combined_with_priority` | `reporter_name` und `priority` werden gemeinsam korrekt gespeichert |
| `test_ticket_has_reporter_name_field` | Jedes Ticket-Objekt enthält das Feld `reporter_name` (Feldpräsenz) |

### Frontend – `frontend/tests/helpdesk.spec.ts` (8 neue E2E-Tests mit Playwright)

| Testname | Was wird geprüft |
|----------|-----------------|
| `Reporter-Name-Feld ist im Formular sichtbar` | Eingabefeld `data-testid="ticket-reporter-name"` ist gerendert |
| `Reporter-Name-Feld hat kein required-Attribut` | Feld ist optional (kein `required`) |
| `Ticket mit reporter_name erstellen und in der Liste anzeigen` | End-to-End: Name eingeben → Submit → Anzeige in `ticket-reporter-name-display` |
| `Ticket ohne reporter_name – kein Submitter sichtbar` | Kein `ticket-submitter`-Bereich ohne Name-Angaben |
| `Fehlermeldung bei mehr als 100 Zeichen` | `reporter-name-error` erscheint, Ticket wird nicht gespeichert |
| `Reporter-Name mit exakt 100 Zeichen wird akzeptiert` | Grenzwert-Test: kein Fehler, Ticket wird angelegt |
| `Reporter-Name-Feld wird nach Submit zurückgesetzt` | Formularfeld ist nach erfolgreichem Submit leer |
| `Reporter-Name deutlich sichtbar in Ticketdetailansicht` | `ticket-submitter` und `ticket-reporter-name-display` mit korrektem Text |

---

## Deployment-Hinweise

### Datenbank-Migration
Das Feld `reporter_name` muss in der bestehenden `tickets`-Tabelle ergänzt werden, **sofern die Datenbank nicht neu initialisiert wird**:

```sql
ALTER TABLE tickets ADD COLUMN reporter_name TEXT NOT NULL DEFAULT '';
```

> ℹ️ `database.py` enthält das `CREATE TABLE`-Statement bereits mit dem neuen Feld. Neu aufgesetzte Umgebungen benötigen kein manuelles SQL.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine – das Feature nutzt ausschließlich bestehende Libraries (FastAPI, Pydantic, SQLite, React).

### Kompatibilität
- **Rückwärtskompatibel**: `reporter_name` ist in allen Endpunkten optional; bestehende Clients ohne das Feld funktionieren weiterhin ohne Änderung.
- **Koexistenz mit `first_name`/`last_name`**: Beide Melderfelder können parallel befüllt sein. Das Frontend priorisiert bei der Anzeige `reporter_name` gegenüber `first_name`/`last_name`.
