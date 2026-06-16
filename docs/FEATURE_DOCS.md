# Feature: Antragsteller-Name & Ticket-Priorität (AGSDLC-18)

## Was wurde implementiert

- **Pflichtfeld `requester_name`** beim Erstellen eines Tickets: Nutzer müssen ihren Namen angeben (1–100 Zeichen, keine Leerzeichen-only-Eingabe – wird serverseitig via Pydantic `field_validator` getrimmt und validiert).
- **Prioritäts-Dropdown im Formular**: Vier Stufen (`low`, `medium`, `high`, `critical`) wählbar; Standardwert ist `medium`. Das Feld ist vollständig validiert – ungültige Werte werden mit HTTP 422 abgewiesen.
- **Backend-Modell & Datenbank erweitert**: `TicketCreate` besitzt die neuen Felder `requester_name` und `priority` mit serverseitiger Validierung; die SQLite-Tabelle erhält die Spalte `requester_name TEXT NOT NULL DEFAULT ''` via Migrations-Guard (`ALTER TABLE … ADD COLUMN` in `init_db()`).
- **Anzeige in der Ticket-Liste**: Der Antragstellername wird in `TicketList` als eigene Zeile (`👤 <Name>`) unter dem Titel eingeblendet (`data-testid="ticket-requester-name-display"`).
- **Seed- & Reset-Daten aktualisiert**: Alle vier Demo-Tickets tragen nun einen `requester_name`; der `/demo/reset`-Endpunkt befüllt das Feld ebenfalls korrekt.

---

## Neue API-Endpunkte

> Es wurden **keine neuen Endpunkte** eingeführt. Bestehende Endpunkte wurden um die neuen Felder erweitert:

| Methode | Pfad | Beschreibung | Geänderte / neue Parameter |
|---------|------|--------------|---------------------------|
| `POST` | `/tickets` | Ticket erstellen | **`requester_name`** *(string, 1–100 Zeichen, Pflicht)*; **`priority`** *(string, default `medium`, erlaubt: `low` · `medium` · `high` · `critical`)* |
| `GET` | `/tickets` | Alle Tickets auflisten | Response-Objekt enthält jetzt `requester_name` |
| `GET` | `/tickets/{id}` | Einzelnes Ticket abrufen | Response-Objekt enthält jetzt `requester_name` |
| `POST` | `/demo/reset` | Demo-Daten zurücksetzen | Seed-Tickets werden inklusive `requester_name` eingespielt |

> Validierungsfehler (fehlender / leerer / zu langer Name, ungültige Priorität) liefern **HTTP 422 Unprocessable Entity**.

---

## Tests

### Backend – `backend/tests/test_api.py` (+10 neue Unit-Tests)

| Test | Was wird geprüft |
|------|-----------------|
| `test_create_ticket_with_requester_name_and_priority` | Name und Priorität werden korrekt persistiert und zurückgegeben |
| `test_create_ticket_default_priority_is_medium` | Fehlende Priorität → Standardwert `medium` wird gesetzt |
| `test_create_ticket_missing_requester_name_returns_422` | Fehlendes Pflichtfeld `requester_name` → HTTP 422 |
| `test_create_ticket_empty_requester_name_returns_422` | Nur-Leerzeichen-Name → HTTP 422 |
| `test_create_ticket_requester_name_too_long_returns_422` | Name > 100 Zeichen → HTTP 422 |
| `test_create_ticket_requester_name_max_length_ok` | Name mit exakt 100 Zeichen → HTTP 201 |
| `test_create_ticket_all_valid_priorities` | Alle vier Prioritätsstufen (`low/medium/high/critical`) → HTTP 201 |
| `test_create_ticket_invalid_priority_returns_422` | Ungültige Priorität (`ultra`) → HTTP 422 |
| `test_ticket_requester_name_visible_in_list` | Erstellter Name erscheint in `GET /tickets` |
| `test_create_ticket_name_gets_stripped` | Führende/nachfolgende Leerzeichen werden automatisch entfernt |
| *(bestehende Tests)* | Alle vorhandenen Tests um `requester_name` in den Request-Payloads ergänzt |

### Frontend – `frontend/tests/helpdesk.spec.ts` (+7 neue Playwright-E2E-Tests)

| Test | Was wird geprüft |
|------|-----------------|
| `AGSDLC-18: Name-Feld ist sichtbar und Pflichtfeld` | Input `ticket-requester-name` ist sichtbar; Absenden ohne Namen zeigt `name-error` |
| `AGSDLC-18: Prioritäts-Dropdown ist sichtbar mit Standardwert Mittel` | Dropdown vorhanden, initialer Wert `medium` |
| `AGSDLC-18: Alle Prioritätsstufen sind wählbar` | Jede Option (`low/medium/high/critical`) lässt sich selektieren |
| `AGSDLC-18: Ticket mit Name und Priorität wird korrekt erstellt` | Vollständiges Happy-Path-Szenario: Name + Priorität `high` → Badge „Hoch" und Namensanzeige in der Liste |
| `AGSDLC-18: Formular ohne Namen zeigt Validierungsfehler, kein Submit` | Ticket-Anzahl bleibt unverändert, Fehlermeldung erscheint |
| `AGSDLC-18: Standardpriorität Mittel wird gesetzt wenn keine Auswahl` | Badge „Mittel" erscheint ohne explizite Auswahl |
| `AGSDLC-18: Priorität Kritisch wird als Badge angezeigt` | Auswahl `critical` → Badge „Kritisch" in der Ticket-Liste sichtbar |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Migration läuft **automatisch** beim Start der Anwendung (`init_db()` in `backend/database.py`):
```sql
ALTER TABLE tickets ADD COLUMN requester_name TEXT NOT NULL DEFAULT '';
```
Ein manueller Eingriff in bestehende Datenbanken ist **nicht erforderlich** – der Guard verhindert Fehler bei bereits vorhandener Spalte. Bestehende Tickets erhalten den leeren Default-String `''`.

### Neue Umgebungsvariablen
Keine neuen Umgebungsvariablen erforderlich.

### Neue Abhängigkeiten
Keine neuen Pakete – ausschließlich bereits vorhandene Bibliotheken (`pydantic`, `fastapi`, `playwright`) werden genutzt.

### Rollback
Im Fehlerfall kann auf den letzten `main`-Stand zurückgerollt werden. Die neue DB-Spalte ist abwärtskompatibel (Default `''`), sodass ein Rollback des Codes ohne Datenverlust möglich ist.
