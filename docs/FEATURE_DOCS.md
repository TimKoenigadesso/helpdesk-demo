# Feature: Melder-Identifikation per Reporter-Name (AGSDLC-17)

## Was wurde implementiert

- **Optionales Namensfeld im Ticket-Formular**: Nutzer können beim Erstellen eines Tickets ihren Vor- und Nachnamen (max. 100 Zeichen) angeben; das Feld ist nicht verpflichtend.
- **Backend-Validierung & Datenhaltung**: Das Feld `reporter_name` wird serverseitig bereinigt (Whitespace-Trimming), als `None` gespeichert wenn leer/nur Leerzeichen, und über eine nicht-destruktive `ALTER TABLE`-Migration in die bestehende SQLite-Datenbank eingefügt.
- **Persistenz & API-Durchreichung**: `reporter_name` wird im Pydantic-Modell `TicketCreate` sowie im Response-Modell `Ticket` geführt und ist in der Einzel- (`GET /tickets/{id}`) sowie in der Listenansicht (`GET /tickets`) enthalten.
- **Frontend-Anzeige**: In `TicketList` wird der Name – sofern vorhanden – mit einem Person-Icon und dem Label „Gemeldet von:" unterhalb der Beschreibung eingeblendet; fehlt der Name, bleibt das Element unsichtbar.
- **Formular-Reset**: Nach erfolgreichem Absenden wird das Namensfeld zusammen mit den übrigen Formularfeldern zurückgesetzt.

---

## Neue API-Endpunkte

Kein neuer Endpunkt – bestehendes `POST /tickets` wurde erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Erstellt ein neues Ticket – **erweitert** um `reporter_name` | **Body (JSON):** `title` (str, required), `description` (str, required), `priority` (str, optional, default `medium`), `reporter_name` (str \| null, optional, max. 100 Zeichen) |
| `GET` | `/tickets` | Liefert alle Tickets – Response enthält jetzt `reporter_name` | – |
| `GET` | `/tickets/{id}` | Liefert ein einzelnes Ticket – Response enthält jetzt `reporter_name` | `id` (int, path) |

---

## Tests

### Backend-Unit-Tests (`backend/tests/test_api.py`) — 8 neue Tests

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_create_ticket_with_reporter_name` | Name wird korrekt gespeichert und in der Response zurückgegeben (`201`) |
| `test_create_ticket_without_reporter_name` | Fehlendes Feld → `reporter_name` ist `None` im Response |
| `test_reporter_name_visible_in_list` | Name erscheint in der Ticket-Übersichtsliste (`GET /tickets`) |
| `test_reporter_name_visible_in_detail` | Name erscheint in der Ticket-Detailansicht (`GET /tickets/{id}`) |
| `test_reporter_name_whitespace_is_stripped` | Führende/nachfolgende Leerzeichen werden serverseitig entfernt |
| `test_reporter_name_only_whitespace_stored_as_none` | Nur-Leerzeichen-Eingabe wird als `None` gespeichert |
| `test_reporter_name_max_length_accepted` | Name mit exakt 100 Zeichen wird akzeptiert (`201`) |
| `test_reporter_name_too_long_rejected` | Name mit 101+ Zeichen wird abgelehnt (`422 Unprocessable Entity`) |

### E2E-Tests (Playwright, `frontend/tests/helpdesk.spec.ts`) — 5 neue Tests

| Testname | Was wird geprüft |
|----------|-----------------|
| `Namensfeld ist im Formular sichtbar und optional` | Input `[data-testid="reporter-name"]` ist sichtbar, kein `required`-Attribut |
| `Ticket ohne Namen erstellen — kein Name in der Anzeige` | `reporter-name-display` bleibt bei anonymem Ticket unsichtbar |
| `Ticket mit Namen erstellen — Name wird in der Übersicht angezeigt` | `reporter-name-display` zeigt korrekten Namen in der Ticket-Liste |
| `Namensfeld wird nach erfolgreicher Einreichung zurückgesetzt` | Formularfelder (inkl. Namensfeld) sind nach Submit leer |
| `Name in Admin-Detailansicht sichtbar` | Name ist im IT-Admin-Dashboard im jeweiligen Ticket sichtbar |

---

## Deployment-Hinweise

### Datenbank-Migration
- **Automatisch, nicht-destruktiv**: `database.py` fügt die Spalte `reporter_name TEXT` via `ALTER TABLE tickets ADD COLUMN` beim App-Start ein, sofern sie noch nicht existiert.
- Ein manuelles Migrations-Skript ist **nicht erforderlich**. Bestehende Tickets erhalten `reporter_name = NULL`.
- ⚠️ Bei SQLite-Deployments ohne persistentes Volume gehen Daten beim Container-Neustart verloren – `DB_PATH` per Umgebungsvariable auf ein persistiertes Verzeichnis zeigen lassen.

### Neue Umgebungsvariablen
Keine neuen Variablen. Vorhandene Variable weiterhin relevant:

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `DB_PATH` | Nein | Pfad zur SQLite-Datei (Default: `./helpdesk.db`). In CI und Produktionsumgebungen setzen. |

### Neue Abhängigkeiten
Keine neuen Pakete – weder im Backend (FastAPI/Pydantic) noch im Frontend (React/Vite).

### Kompatibilität
- Das neue Feld ist vollständig rückwärtskompatibel: Clients, die `reporter_name` nicht senden, erhalten `null` im Response ohne Fehler.
- Bestehende API-Clients müssen **nicht** angepasst werden.
