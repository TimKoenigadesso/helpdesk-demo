# Feature: Ticket-Erstellung mit Typ und Priorität (AGSDLC-3)

## Was wurde implementiert

- **Neue Pflichtfelder `type` und `priority`** im Ticket-Erstellungsformular: Nutzer wählen den Ticket-Typ (`Task`, `Bug`, `Story`) und die Priorität (`Low`, `Medium`, `High`, `Critical`) über Dropdowns aus – Standardwerte greifen, wenn keine explizite Auswahl erfolgt (`task` / `medium`)
- **Server-seitige Validierung** per Pydantic `field_validator` in `models.py`: leere/Leerzeichen-Titel sowie ungültige Enum-Werte für Typ und Priorität werden mit HTTP 422 abgewiesen, bevor die Datenbank berührt wird
- **DB-Schema erweitert** in `database.py`: neue Spalte `type TEXT NOT NULL DEFAULT 'task'` per `ALTER TABLE … ADD COLUMN`-Guard (idempotent, bricht keine bestehenden Deployments)
- **Frontend komplett überarbeitet** (`TicketForm.tsx`): client-seitige Inline-Validierung mit Feld-bezogenen Fehlermeldungen (`data-testid="error-title"` / `error-description`), Erfolgs-Banner mit Ticket-ID, „Verwerfen"-Button mit Dirty-Check und Bestätigungs-Dialog, Formular-Reset nach erfolgreichem Submit
- **Typ-Badge in Ticket-Liste** (`TicketList.tsx`): farbcodierte Badges (Blau = Task, Rot = Bug, Lila = Story) und sichtbare Ticket-ID (`#<id>`) als Meta-Information

---

## Neue API-Endpunkte

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Erstellt ein neues Ticket | **Body (JSON):** `title` *(string, Pflicht)*, `description` *(string, Pflicht)*, `type` *(string, optional – `task`\|`bug`\|`story`, Default: `task`)*, `priority` *(string, optional – `low`\|`medium`\|`high`\|`critical`, Default: `medium`)* |
| `GET` | `/tickets` | Gibt alle Tickets zurück (unverändert) | – |

> **Geänderte Response-Felder** bei `POST /tickets` (und `GET /tickets`):  
> Das `Ticket`-Schema enthält neu das Feld `type: string` zusätzlich zu den bestehenden Feldern `id`, `title`, `description`, `status`, `category`, `priority`, `ai_suggestion`, `created_at`.

---

## Tests

### Backend – `backend/tests/test_api.py` (12 neue Unit-Tests)

| Testname | Was wird geprüft |
|---|---|
| `test_create_ticket_with_type_and_priority` | Vollständiges Ticket mit `story` + `high` wird mit Status 201 erstellt und alle Felder korrekt zurückgegeben |
| `test_create_ticket_type_bug` | Bug-Ticket mit `critical`-Priorität wird korrekt persistiert |
| `test_create_ticket_type_task` | Task-Ticket mit `low`-Priorität wird korrekt persistiert |
| `test_create_ticket_default_type_and_priority` | Ohne Typ/Priorität werden Defaults `task` / `medium` gesetzt |
| `test_create_ticket_invalid_type` | Ungültiger Typ (`epic`) → HTTP 422 |
| `test_create_ticket_invalid_priority` | Ungültige Priorität (`ultra`) → HTTP 422 |
| `test_create_ticket_missing_title` | Leerer Titel `""` → HTTP 422 |
| `test_create_ticket_whitespace_title` | Whitespace-only-Titel `"   "` → HTTP 422 |
| `test_create_ticket_returns_unique_id` | Zwei aufeinanderfolgende Tickets erhalten unterschiedliche IDs |
| `test_created_ticket_appears_in_list` | Erstelltes Ticket taucht in `GET /tickets` auf |
| `test_create_ticket_all_valid_types` | Alle drei Typen (`task`, `bug`, `story`) werden parametrisiert akzeptiert |
| `test_create_ticket_all_valid_priorities` | Alle vier Prioritäten (`low`, `medium`, `high`, `critical`) werden parametrisiert akzeptiert |

### Frontend (E2E) – `frontend/tests/helpdesk.spec.ts` (14 neue Playwright-Tests)

| Testname | Was wird geprüft |
|---|---|
| Alle Pflichtfelder sichtbar | Formular rendert `ticket-title`, `ticket-description`, `ticket-type`, `ticket-priority`, `ticket-submit` |
| Ticket erstellen + Bestätigung | Vollständiger Happy Path: Felder ausfüllen → Submit → Erfolgs-Banner mit `Ticket #` erscheint → Ticket in Liste sichtbar |
| Typ-Dropdown Optionen | `task`, `bug`, `story` sind genau einmal als `<option>` vorhanden |
| Priorität-Dropdown Optionen | `low`, `medium`, `high`, `critical` sind genau einmal vorhanden |
| Pflichtfeld-Validierung: leerer Titel | `error-title` erscheint, kein `ticket-success` |
| Pflichtfeld-Validierung: leere Beschreibung | `error-description` erscheint, kein `ticket-success` |
| Alle Felder leer | Beide Fehlermeldungen gleichzeitig sichtbar |
| Fehler verschwindet nach Eingabe | Sobald Titel befüllt wird, verschwindet `error-title` ohne erneuten Submit |
| Formular-Reset nach Submit | Titel und Beschreibung sind nach erfolgreichem Erstellen geleert |
| Typ-Badge in Liste | Nach Submit erscheint `ticket-type-badge` mit Text `Bug` |
| Verwerfen-Button Zustand | Initial `disabled`; nach Eingabe `enabled` |
| Verwerfen-Dialog – Bestätigen | Dialog-`accept()` leert das Formular |
| Verwerfen-Dialog – Abbrechen | Dialog-`dismiss()` behält alle Eingaben |
| Story-Ticket Low-Prio | Story mit `low`-Priorität erscheint in Liste mit korrektem Badge |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Spalte `type` wird per **idempotentem `ALTER TABLE … ADD COLUMN`-Guard** hinzugefügt (in `database.py`, Block `_ensure_columns`). Bestehende Datensätze erhalten automatisch den Defaultwert `'task'`. **Kein manueller Migrations-Schritt notwendig** – der Guard läuft beim ersten Start der Anwendung.

> ⚠️ Bei Verwendung einer externen Datenbank (PostgreSQL/MySQL statt SQLite) muss die Migration manuell via `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'task'` ausgeführt werden, da der Guard SQLite-spezifisch implementiert ist.

### Neue Umgebungsvariablen
Keine neuen Umgebungsvariablen erforderlich.

### Neue Abhängigkeiten
Keine neuen Python-Pakete oder npm-Packages erforderlich. Pydantic `field_validator` ist Bestandteil der bereits genutzten Pydantic v2.

### Breaking Changes
- Der `POST /tickets`-Request-Body ist **abwärtskompatibel**: bestehende Clients, die nur `title` und `description` senden, erhalten weiterhin HTTP 201 (Defaults werden angewendet).
- Das `Ticket`-Response-Schema enthält das **neue Feld `type`** – Clients, die strikt auf unbekannte Felder validieren, müssen aktualisiert werden.
