# Feature: Submitter-Name & Prioritätssortierung bei Ticket-Erstellung (AGSDLC-20)

## Was wurde implementiert

- **Getrennte Vor-/Nachname-Felder im Ticket-Formular:** Nutzer können beim Erstellen eines Tickets optional ihren Vor- und Nachnamen angeben; beide Felder sind nicht verpflichtend (`required`-Attribut fehlt bewusst).
- **Persistierung in der Datenbank:** Die Spalten `first_name` und `last_name` (SQLite `TEXT NOT NULL DEFAULT ''`) wurden per `ALTER TABLE`-Migration ergänzt – bestehende Tickets erhalten automatisch leere Strings als Default, die Rückwärtskompatibilität bleibt gewahrt.
- **Anzeige in der Ticket-Liste:** Sind Vor- und/oder Nachname gesetzt, erscheint unter dem Ticket-Titel der Hinweis „Gemeldet von: \<Vorname\> \<Nachname\>"; ohne Namensangabe bleibt der Bereich vollständig ausgeblendet.
- **Neue Sortieroption `priority_lastname`:** Der `GET /tickets`-Endpunkt unterstützt den Query-Parameter `sort=priority_lastname`, der Tickets primär nach Priorität (Critical → High → Medium → Low) und sekundär alphabetisch nach Nachname sortiert.
- **Whitespace-Bereinigung im Backend:** Führende und nachgestellte Leerzeichen werden in `first_name` und `last_name` serverseitig via `.strip()` entfernt – sowohl beim Anlegen als auch beim Aktualisieren eines Tickets.

---

## Neue API-Endpunkte

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `GET` | `/tickets` | Alle Tickets auflisten | `sort` *(Query, optional)*: `created_at` (Standard, neueste zuerst) \| `priority_lastname` (nach Priorität desc + Nachname asc) |
| `POST` | `/tickets` | Neues Ticket erstellen | **Body (JSON):** `title` *(string, required)*, `description` *(string, required)*, `priority` *(string, optional, default `medium`)*, `first_name` *(string, optional, default `""`)*, `last_name` *(string, optional, default `""`)* |
| `PUT` | `/tickets/{id}` | Ticket aktualisieren | **Body (JSON, alle optional):** `title`, `description`, `status`, `category`, `priority`, `ai_suggestion`, `first_name`, `last_name` |

> Alle Endpunkte geben das vollständige `Ticket`-Objekt zurück, das ab dieser Version die Felder `first_name: string` und `last_name: string` enthält.

---

## Tests

### Backend – `backend/tests/test_api.py` (11 neue Tests)

| Testfunktion | Was wird geprüft |
|---|---|
| `test_create_ticket_with_first_and_last_name` | Vor- und Nachname werden beim Erstellen korrekt gespeichert und zurückgegeben |
| `test_create_ticket_without_name_uses_empty_defaults` | Tickets ohne Namensangabe erhalten leere Strings als Default (Abwärtskompatibilität) |
| `test_create_ticket_with_priority_and_name` | Kombination aus Priorität, Vor- und Nachname wird vollständig persistiert |
| `test_first_last_name_visible_in_detail` | Namen erscheinen im Einzelticket-Endpunkt (`GET /tickets/{id}`) |
| `test_first_last_name_visible_in_list` | Namen erscheinen in der Gesamtliste (`GET /tickets`) |
| `test_update_ticket_first_last_name` | Vor- und Nachname können via `PUT /tickets/{id}` nachträglich geändert werden |
| `test_sort_tickets_by_priority_and_lastname` | `sort=priority_lastname` liefert korrekte Reihenfolge: Critical-Adler vor Critical-Becker, dann High, dann Low |
| `test_whitespace_stripped_from_name` | Leerzeichen am Rand werden serverseitig entfernt |
| `test_create_ticket_only_first_name` | Nur Vorname ohne Nachname ist zulässig; `last_name` bleibt `""` |
| `test_create_ticket_only_last_name` | Nur Nachname ohne Vorname ist zulässig; `first_name` bleibt `""` |
| `test_all_four_priorities_with_names` | Alle vier Prioritätsstufen (`low`, `medium`, `high`, `critical`) funktionieren in Kombination mit Namen |

### Frontend (E2E) – `frontend/tests/helpdesk.spec.ts` (7 neue Playwright-Tests)

| Testname | Was wird geprüft |
|---|---|
| Vorname- und Nachname-Felder sind im Formular sichtbar | Beide Eingabefelder rendern korrekt auf der Seite |
| Ticket mit Vor- und Nachname erstellen und in der Liste anzeigen | End-to-End-Flow: Eingabe → Submit → Anzeige in der Liste mit korrekten `data-testid`-Werten |
| Ticket ohne Namen erstellen – kein Submitter-Bereich sichtbar | Abwesenheit des „Gemeldet von"-Blocks, wenn keine Namen eingegeben wurden |
| Ticket mit Priorität Kritisch und Name erstellen | Kombination aus Critical-Banner, Prioritäts-Label und Namensanzeige |
| Formular-Felder werden nach dem Absenden zurückgesetzt | Alle Felder (Titel, Vorname, Nachname) sind nach erfolgreichem Submit leer |
| Vorname-Feld hat kein `required`-Attribut | Optionalität des Vorname-Feldes wird explizit auf DOM-Ebene geprüft |
| Nachname-Feld hat kein `required`-Attribut | Optionalität des Nachname-Feldes wird explizit auf DOM-Ebene geprüft |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Migration ist **automatisch** und **nicht-destruktiv**: `database.py` führt beim Start via `ALTER TABLE tickets ADD COLUMN` die zwei neuen Spalten ein. Schlägt das `ALTER TABLE` fehl (Spalte existiert bereits), wird der Fehler stillschweigend ignoriert. Kein manueller Migrations-Schritt notwendig.

```sql
-- Wird automatisch durch init_db() ausgeführt:
ALTER TABLE tickets ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN last_name  TEXT NOT NULL DEFAULT '';
```

> ⚠️ **Bestehende Produktions-DBs:** Tickets, die vor diesem Release angelegt wurden, erhalten `first_name = ""` und `last_name = ""` als Standardwert – keine Datenverluste, keine Nullwerte.

### Neue Umgebungsvariablen
Keine neuen Umgebungsvariablen erforderlich.

### Neue Abhängigkeiten
Keine neuen Python- oder Node-Pakete. Die TypeScript-Compiler-Version wurde im Build-Artefakt (`tsconfig.app.tsbuildinfo`) von **5.9.3 → 6.0.3** aktualisiert – sicherstellen, dass die CI-Umgebung TypeScript ≥ 6.0 nutzt.

### Frontend
Das TypeScript-Interface `Ticket` in `frontend/src/api.ts` wurde um `first_name: string` und `last_name: string` ergänzt. Alle Komponenten, die das `Ticket`-Objekt destructuren, sind abwärtskompatibel (leere Strings als Fallback).
