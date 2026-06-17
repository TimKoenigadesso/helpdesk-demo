# Feature: Melder-Name für Tickets (AGSDLC-17)

## Was wurde implementiert

- **Optionales `reporter_name`-Feld** in der Ticket-Erstellung: Nutzer können beim Einreichen eines Tickets ihren Vor- und Nachnamen angeben (max. 100 Zeichen).
- **Backend-Validierung** über Pydantic (`max_length=100`): Whitespace-only-Eingaben werden serverseitig auf `None` normiert (`.strip()`), Namen mit > 100 Zeichen werden mit HTTP 422 abgelehnt.
- **Datenbank-Migration** per `ALTER TABLE`: Die Spalte `reporter_name TEXT` wird beim Start der Anwendung automatisch zur bestehenden `tickets`-Tabelle hinzugefügt (idempotent via `try/except`).
- **Frontend-Integration** in `TicketForm`: Neues Eingabefeld „Ihr Name (optional)" mit `maxlength="100"` und automatischem Trimming beim Absenden; leere Eingabe wird als `undefined` (kein Feld) übergeben.
- **Anzeige in der Ticket-Liste** (`TicketList`): Sofern vorhanden, wird der Melder-Name mit einem Person-Icon als „Gemeldet von: \<Name\>" unterhalb der Beschreibung eingeblendet.

---

## Neue API-Endpunkte

Es wurden keine neuen Routen eingeführt. Der bestehende Endpunkt wurde um das optionale Feld `reporter_name` erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen *(erweitert)* | **Body (JSON):** `title` *(string, required)*, `description` *(string, required)*, `priority` *(string, optional, default: `"medium"`)*, `reporter_name` *(string \| null, optional, max. 100 Zeichen)* |
| `GET` | `/tickets` | Alle Tickets abrufen *(erweitert)* | — Response enthält nun `reporter_name: string \| null` pro Ticket |
| `GET` | `/tickets/{id}` | Einzelnes Ticket abrufen *(erweitert)* | — Response enthält nun `reporter_name: string \| null` |

**Response-Erweiterung** (`Ticket`-Schema): Das Antwort-Objekt aller Ticket-Endpunkte enthält das neue Feld:
```json
{
  "id": 1,
  "reporter_name": "Max Mustermann",
  ...
}
```

---

## Tests

### Backend – `backend/tests/test_api.py` (8 neue Unit-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_create_ticket_with_reporter_name` | Name wird gespeichert und korrekt zurückgegeben (HTTP 201) |
| `test_create_ticket_without_reporter_name` | Fehlendes Feld ergibt `reporter_name: null` im Response |
| `test_reporter_name_visible_in_detail` | Name erscheint in der Detailansicht (`GET /tickets/{id}`) |
| `test_reporter_name_visible_in_list` | Name erscheint in der Listenansicht (`GET /tickets`) |
| `test_reporter_name_max_length` | Name mit exakt 100 Zeichen wird akzeptiert (Grenzwerttest) |
| `test_reporter_name_too_long_rejected` | Name mit 101 Zeichen wird mit HTTP 422 abgelehnt |
| `test_reporter_name_whitespace_only_stored_as_none` | Nur-Whitespace-Eingabe wird als `null` gespeichert |
| `test_reporter_name_is_trimmed` | Führende/abschließende Leerzeichen werden server-seitig entfernt |

### Frontend (E2E) – `frontend/tests/helpdesk.spec.ts` (4 neue Playwright-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `Namensfeld ist im Formular sichtbar und optional` | Input ist im DOM vorhanden, Label enthält den Hinweis „(optional)" |
| `Ticket mit Namen erstellen — Name wird in der Liste angezeigt` | Vollständiger Happy-Path: Eingabe → Absenden → `reporter-name`-Element mit korrektem Inhalt sichtbar |
| `Ticket ohne Namen erstellen — kein Melder-Bereich sichtbar` | Kein `reporter-name`-Element sichtbar, wenn kein Name eingegeben wurde |
| `Namensfeld hat maximale Länge von 100 Zeichen` | `maxlength`-Attribut ist korrekt auf `100` gesetzt |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Migration ist **automatisch und rückwärtskompatibel**. Beim ersten Start nach dem Deployment führt `init_db()` in `backend/database.py` ein `ALTER TABLE tickets ADD COLUMN reporter_name TEXT` aus. Der `try/except`-Block stellt sicher, dass bereits migrierte Datenbanken keinen Fehler werfen. **Kein manueller Eingriff nötig.**

> ⚠️ **SQLite-spezifisch:** Die Migration funktioniert direkt für die SQLite-basierte Entwicklungs- und Produktionsumgebung. Bei einem zukünftigen Wechsel zu PostgreSQL/MySQL muss eine explizite Alembic-Migration erstellt werden.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine – das Feature nutzt ausschließlich bereits vorhandene Bibliotheken (`FastAPI`, `Pydantic`, `React`, `Playwright`).

### Frontend-Build
Nach dem Deployment muss ein neuer Frontend-Build erzeugt werden, da `api.ts`, `TicketForm.tsx` und `TicketList.tsx` geändert wurden:
```bash
cd frontend && npm run build
```
