# Feature: Melder-Namensfeld im Meldungsformular (AGSDLC-17)

## Was wurde implementiert

- **Optionales Namensfeld im Ticket-Formular** – Nutzer können beim Erstellen eines Tickets freiwillig ihren Vor- und Nachnamen angeben (`reporter_name`, max. 100 Zeichen).
- **Backend-Persistenz** – Das Feld `reporter_name TEXT` wurde der SQLite-Tabelle `tickets` hinzugefügt; bestehende Datenbanken werden per `ALTER TABLE` automatisch migriert (`database.py`). Das Pydantic-Modell `TicketCreate` validiert die Länge (≤ 100 Zeichen), reine Leerzeichen werden serverseitig auf `null` normiert.
- **API-Erweiterung** – `POST /tickets` akzeptiert das neue optionale Feld und gibt es im Response-Objekt zurück; `GET /tickets` und `GET /tickets/{id}` liefern `reporter_name` ebenfalls mit.
- **Frontend-Anzeige** – Die Ticket-Karte in `TicketList` zeigt den Melder-Namen (mit Person-Icon) an, sofern vorhanden – sowohl in der Nutzer- als auch in der Admin-Ansicht.
- **Client-seitige Validierung** – Das `<input>`-Element begrenzt die Eingabe via `maxLength={100}`; zusätzlich prüft der Submit-Handler die Länge und zeigt eine inline Fehlermeldung an (`reporter-name-error`), bevor ein API-Request abgesetzt wird.

## Neue API-Endpunkte

Kein neuer Endpunkt – bestehende Endpunkte wurden um das Feld `reporter_name` erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Erstellt ein neues Ticket – nun mit optionalem Melder-Namen | **Body (JSON):** `title` *(string, required)*, `description` *(string, required)*, `priority` *(string, optional, default: `"medium"`)*, `reporter_name` *(string \| null, optional, max. 100 Zeichen)* |
| `GET` | `/tickets` | Liefert alle Tickets inkl. `reporter_name` im Response | – |
| `GET` | `/tickets/{id}` | Liefert ein einzelnes Ticket inkl. `reporter_name` | **Path:** `id` *(int)* |

**Response-Schema-Erweiterung** (`Ticket`-Objekt, alle Endpunkte):
```jsonc
{
  "id": 1,
  "title": "Drucker funktioniert nicht",
  "reporter_name": "Max Mustermann",   // neu – null wenn nicht angegeben
  ...
}
```

## Tests

### Backend – `backend/tests/test_api.py` (8 neue Unit-Tests)

| Testname | Was wird geprüft |
|---|---|
| `test_create_ticket_with_reporter_name` | `reporter_name` wird korrekt gespeichert und im 201-Response zurückgegeben |
| `test_create_ticket_without_reporter_name` | Fehlendes Feld → `reporter_name` ist `null` im Response |
| `test_create_ticket_reporter_name_whitespace_becomes_none` | Nur-Leerzeichen-Eingabe wird serverseitig auf `null` normiert |
| `test_reporter_name_visible_in_list` | Name erscheint in `GET /tickets`-Response |
| `test_reporter_name_visible_in_detail` | Name erscheint in `GET /tickets/{id}`-Response |
| `test_reporter_name_max_length_validation` | Name > 100 Zeichen → Pydantic gibt HTTP 422 zurück |
| `test_reporter_name_exactly_100_chars_accepted` | Exakt 100 Zeichen → HTTP 201, Name vollständig gespeichert |
| `test_reporter_name_persisted_after_update` | `reporter_name` bleibt nach einem `PUT`-Update (z. B. Status-Änderung) erhalten |
| `test_ticket_without_reporter_name_has_null_field` | Das Feld `reporter_name` existiert im Response-Objekt, auch wenn es `null` ist |

### Frontend – `frontend/tests/helpdesk.spec.ts` (5 neue E2E-Tests mit Playwright)

| Testname | Was wird geprüft |
|---|---|
| *Namensfeld ist im Meldeformular sichtbar* | Input (`data-testid="reporter-name"`) und Label „Ihr Name" sind gerendert |
| *Ticket ohne Name erstellen* | Submit ohne Namensangabe → Ticket erscheint, kein Fehler-Element sichtbar |
| *Ticket mit Name erstellen* | Name wird nach Submit in der Ticket-Karte unter `reporter-name-display` angezeigt |
| *Name erscheint auch in der Admin-Ansicht* | Wechsel in Admin-View → `reporter-name-display` enthält den gespeicherten Namen |
| *Formular-Validierung: Name > 100 Zeichen* | `maxlength`-Attribut wird per `evaluate` entfernt, langer String gesetzt → Fehlermeldung `reporter-name-error` wird sichtbar und enthält „100 Zeichen" |
| *Namensfeld wird nach erfolgreichem Absenden geleert* | Nach Submit hat das Input-Feld den Wert `""` |

## Deployment-Hinweise

### Datenbank-Migration
> ⚠️ **Automatisch** – kein manueller Eingriff erforderlich.

`database.py` führt beim Start ein `ALTER TABLE tickets ADD COLUMN reporter_name TEXT` aus (wird bei bestehenden DBs automatisch angewendet, Fehler bei bereits vorhandenem Feld werden ignoriert). Neue Datenbanken erhalten die Spalte direkt im `CREATE TABLE`-Statement.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine zusätzlichen Pakete – das `max_length`-Constraint nutzt das bereits vorhandene `pydantic.Field`.

### TypeScript-Interface
Das `Ticket`-Interface in `frontend/src/api.ts` wurde um `reporter_name: string | null` erweitert. Bei einem separaten Frontend-Build-Schritt ist sicherzustellen, dass die aktuellen Typen verwendet werden (`npm run build`).

### Rollback-Strategie
Das neue Feld ist vollständig optional und rückwärtskompatibel. Ein Rollback auf den vorherigen Stand erfordert lediglich das Entfernen der Spalte aus der Datenbank (SQLite unterstützt kein `DROP COLUMN` < v3.35 – ggf. Daten migrieren oder DB neu initialisieren).
