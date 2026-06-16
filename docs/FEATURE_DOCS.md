# Feature: Melder kann optionalen Namen bei Ticket-Erstellung angeben (AGSDLC-17)

## Was wurde implementiert

- **Datenbankschema erweitert:** Neue Spalte `reporter_name TEXT` in der `tickets`-Tabelle; rückwärtskompatible Migration via `ALTER TABLE` beim App-Start (kein manuelles SQL erforderlich).
- **Backend-Modelle & Validierung:** `TicketCreate`, `TicketUpdate` und `Ticket` (Pydantic) enthalten `reporter_name` als optionales Feld (max. 100 Zeichen); ein `field_validator` trimmt Whitespace und speichert reine Leerzeichen-Eingaben als `None`.
- **API-Endpunkte angepasst:** `POST /tickets` persistiert den Melder-Namen; `PUT /tickets/{id}` erlaubt nachträgliche Aktualisierung; `GET /tickets` und `GET /tickets/{id}` liefern das Feld zurück.
- **Frontend – Formular:** `TicketForm` enthält ein neues optionales Textfeld „Ihr Name" (`data-testid="ticket-reporter-name"`, `maxLength=100`) mit clientseitiger Fehleranzeige bei Überschreitung der Zeichengrenze.
- **Frontend – Ticket-Karte:** `TicketList` zeigt den Namen mit Personen-Icon (`data-testid="ticket-reporter-name-display"`) an, sofern er vorhanden ist; fehlt der Name, bleibt die Anzeige vollständig ausgeblendet.

---

## Neue API-Endpunkte

> Bestehende Endpunkte wurden um das Feld `reporter_name` **erweitert** – keine neuen Routen.

| Methode | Pfad              | Beschreibung                                          | Parameter (Body)                                                                                          |
|---------|-------------------|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `POST`  | `/tickets`        | Ticket anlegen – optional mit Melder-Name             | `title: str` *(req.)*, `description: str` *(req.)*, `reporter_name?: str \| null` *(opt., max. 100 Z.)* |
| `PUT`   | `/tickets/{id}`   | Ticket aktualisieren – reporter_name nachträglich setzen | `reporter_name?: str \| null` *(opt., max. 100 Z.)*, weitere Update-Felder wie bisher                   |
| `GET`   | `/tickets`        | Alle Tickets abrufen – Antwort enthält `reporter_name` | –                                                                                                         |
| `GET`   | `/tickets/{id}`   | Einzelnes Ticket abrufen – Antwort enthält `reporter_name` | `id: int` *(path)*                                                                                    |

**Response-Erweiterung** (alle Ticket-Objekte):
```json
{
  "reporter_name": "Max Mustermann"   // string | null
}
```

---

## Tests

### Backend – pytest (`backend/tests/test_api.py`)

| Testname | Was wird geprüft |
|---|---|
| `test_create_ticket_with_reporter_name` | Ticket mit Name erstellen → `reporter_name` wird korrekt zurückgegeben (HTTP 201) |
| `test_create_ticket_without_reporter_name` | Ticket ohne Name → `reporter_name` ist `null` (Feld bleibt optional) |
| `test_reporter_name_persisted_and_retrievable` | Name wird in DB gespeichert und via `GET /tickets/{id}` wieder abrufbar |
| `test_reporter_name_in_list` | Name erscheint in der Ticket-Übersicht (`GET /tickets`) |
| `test_reporter_name_max_length_exceeded` | Name > 100 Zeichen → HTTP 422 Validation Error |
| `test_reporter_name_max_length_exact` | Name mit exakt 100 Zeichen → HTTP 201, kein Fehler |
| `test_reporter_name_whitespace_only_stored_as_none` | Nur-Whitespace-Eingabe (`"   "`) → wird als `null` gespeichert |
| `test_reporter_name_stripped` | Führende/nachfolgende Leerzeichen (`"  Anna Schmidt  "`) → werden getrimmt gespeichert |

### Frontend – Playwright E2E (`frontend/tests/helpdesk.spec.ts`)

| Testname | Was wird geprüft |
|---|---|
| `Namensfeld ist im Formular sichtbar` | Input `[data-testid="ticket-reporter-name"]` ist nach Seitenaufruf sichtbar |
| `Ticket mit Namen erstellen – Name wird in Übersicht angezeigt` | Happy Path: Name wird nach Submit in der Ticket-Karte als `ticket-reporter-name-display` angezeigt |
| `Ticket ohne Namen erstellen – kein Namensfeld sichtbar im Ticket` | Anonymes Ticket: `ticket-reporter-name-display` ist **nicht** sichtbar |
| `Name mit mehr als 100 Zeichen – Validierungsfehler wird angezeigt` | Browser `maxLength=100` begrenzt die Eingabe; geprüft via `.inputValue().length ≤ 100` |

---

## Deployment-Hinweise

### Datenbank-Migration
**Keine manuelle Migration erforderlich.** Die Spalte `reporter_name TEXT` wird beim App-Start automatisch per `ALTER TABLE tickets ADD COLUMN reporter_name TEXT` ergänzt, sofern sie noch nicht existiert. Bestehende Tickets erhalten automatisch `NULL` als Wert – vollständig abwärtskompatibel.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine – das Feature nutzt ausschließlich bereits vorhandene Dependencies (Pydantic `Field` + `field_validator` waren bereits Teil von `pydantic>=2`).

### Rollback
Das Feld ist in DB und API vollständig optional (`NULL`-fähig). Ein Rollback auf die Vorversion des Backends hinterlässt die Spalte in der Datenbank, verursacht jedoch keine Fehler, da unbekannte Spalten von SQLite ignoriert werden.
