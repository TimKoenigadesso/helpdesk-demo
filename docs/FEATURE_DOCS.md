# Feature: P0–P4 Prioritätsstufen für Helpdesk-Tickets (AGSDLC-38)

## Was wurde implementiert

- **Neues Datenbankfeld `p_level`**: Optionale Spalte (`TEXT`, nullable) in der `tickets`-Tabelle, die eine von fünf Stufen (`P0`–`P4`) aufnimmt; bestehende Tickets erhalten `NULL` via `ALTER TABLE`-Migration ohne Datenverlust.
- **Backend-Validierung**: In `models.py` wurde `VALID_P_LEVELS = {"P0", "P1", "P2", "P3", "P4"}` definiert; `POST /tickets` und `PUT /tickets/{id}` validieren den Wert – ungültige Eingaben werden beim Erstellen stillschweigend auf `null` gesetzt, beim Update mit HTTP 422 abgelehnt.
- **Frontend-Formular (`TicketForm`)**: Fünf Radio-Buttons (P0–P4) mit kontextsensitivem Tooltip-Banner und Reset-Button; P0 wird visuell rot hervorgehoben; ein versteckter `<select>` sichert Barrierefreiheit und Testbarkeit (`data-testid="ticket-p-level"`).
- **Neue Komponente `PLevelBadge`**: Zeigt das P-Level farbkodiert als Badge an (P0 = Rot, P1 = Hellrot, P2 = Orange, P3 = Gelb, P4 = Grau); wird in `TicketList` neben dem bestehenden `PriorityBadge` gerendert.
- **Erweiterter Kritisch-Banner**: In `TicketList` löst neben `priority=critical` nun auch `p_level=P0` den roten Warnseitenstreifen mit eigenem Text *„P0 – Sofortiger Handlungsbedarf (Eskalation)"* aus.

---

## Neue API-Endpunkte

Das Feature erweitert **bestehende** Endpunkte; es wurden keine neuen Routen eingeführt.

| Methode | Pfad | Beschreibung | Relevante Parameter |
|---------|------|--------------|---------------------|
| `POST` | `/tickets` | Ticket erstellen | `p_level?: "P0"\|"P1"\|"P2"\|"P3"\|"P4"` (optional, default `null`; ungültige Werte → `null`) |
| `GET` | `/tickets` | Alle Tickets auflisten | Antwort enthält jetzt das Feld `p_level: string \| null` je Ticket |
| `GET` | `/tickets/{id}` | Ticket-Detail | Antwort enthält jetzt das Feld `p_level: string \| null` |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren | `p_level?: "P0"–"P4"` (optional; ungültige Werte → HTTP 422) |

---

## Tests

### Backend – `backend/tests/test_api.py` (16 neue Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_create_ticket_without_p_level_returns_null` | Fehlendes `p_level` → API gibt `null` zurück |
| `test_create_ticket_with_p_level_p0` … `_p4` | Jede der fünf Stufen wird korrekt gespeichert und zurückgegeben |
| `test_all_p_levels_are_valid` | Schleife über P0–P4: alle 201-Antworten mit korrektem Wert |
| `test_create_ticket_invalid_p_level_stored_as_null` | `"P5"` → wird stillschweigend auf `null` gesetzt (kein Fehler beim Erstellen) |
| `test_p_level_visible_in_detail` | Gespeichertes P-Level erscheint im Detail-Endpunkt |
| `test_p_level_visible_in_list` | Gespeichertes P-Level erscheint in der Listenansicht |
| `test_update_ticket_p_level` | Nachträgliches Setzen via `PUT` wird korrekt persistiert |
| `test_update_ticket_invalid_p_level_returns_422` | Ungültiger Wert beim Update → HTTP 422 |
| `test_create_ticket_p_level_and_priority_combined` | `priority` und `p_level` sind unabhängig kombinierbar |
| `test_create_ticket_p_level_with_name` | `p_level` funktioniert gemeinsam mit `first_name`/`last_name` |
| `test_p_level_none_does_not_trigger_validation_error` | Explizit `null` übergeben → valide, kein Fehler |

### Frontend – `frontend/tests/helpdesk.spec.ts` (9 neue Playwright-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `P-Level Optionen P0 bis P4 sind im Formular sichtbar` | Alle fünf Radio-Optionen und alle `<option>`-Elemente im versteckten Select vorhanden |
| `Ticket ohne P-Level erstellen — kein p-level-badge sichtbar` | Kein `PLevelBadge` bei ungesetztem P-Level |
| `Ticket mit P0 erstellen zeigt kritischen Banner und Badge` | Kritisch-Banner und Badge mit Text „P0" erscheinen |
| `Ticket mit P1 erstellen zeigt P1-Badge` | P1-Badge sichtbar, **kein** Kritisch-Banner |
| `Ticket mit P4 erstellen zeigt P4-Badge` | Niedrigste Stufe wird korrekt angezeigt |
| `P-Level Tooltip erscheint beim Hover über Option` | Tooltip wird bei `mouseenter` sichtbar und enthält „P0" |
| `P-Level Feld hat kein required-Attribut` | Bestätigt optionalen Charakter des Feldes |
| `Formular-Felder werden nach dem Absenden zurückgesetzt (inkl. P-Level)` | Nach Submit ist `p_level` auf leer zurückgesetzt |
| `P0 Ticket wird visuell rot hervorgehoben (ring-Klasse)` | Ticket-Item besitzt CSS-Klasse `ring-red-300` |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Migration läuft **automatisch** beim Start über `init_db()` in `database.py`:

```sql
-- Neue Spalte (nullable, kein DEFAULT-Zwang)
ALTER TABLE tickets ADD COLUMN p_level TEXT;
```

> **Kompatibilität:** Bestehende Tickets erhalten `NULL`; das Schema ist vollständig abwärtskompatibel – kein manuelles Migrations-Skript nötig.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine zusätzlichen Python-Packages oder npm-Pakete erforderlich.

### Hinweise für den Review
- Die Validierungslogik bei `POST /tickets` verwirft ungültige P-Level **still** (→ `null`), während `PUT /tickets/{id}` einen **422**-Fehler wirft. Dieses asymmetrische Verhalten ist so implementiert und getestet; bei Bedarf im Team abstimmen.
- Das TypeScript-Interface `Ticket` in `frontend/src/api.ts` enthält jetzt `p_level: string | null` – alle Consumer des Interfaces sollten auf `null`-Fälle prüfen.
