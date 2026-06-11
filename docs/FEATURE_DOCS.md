# Feature: Kommentar-System für Helpdesk-Tickets (AGSDLC-1)

## Was wurde implementiert

- **Backend – Kommentar-API**: Drei neue REST-Endpunkte (`GET`, `POST`, `DELETE`) unter `/tickets/{id}/comments` mit vollständiger Pydantic-Validierung (`CommentCreate`, `Comment`) und Autor-Whitelist (`Mitarbeiter`, `IT-Admin`)
- **Datenbank – `comments`-Tabelle**: Neue SQLite-Tabelle mit Fremdschlüssel-Relation zu `tickets` (`ON DELETE CASCADE`) sowie aktiviertem `PRAGMA foreign_keys = ON` für referentielle Integrität
- **Frontend – `CommentSection`-Komponente**: Neue React-Komponente mit ein-/ausklappbarem Kommentarbereich, Kommentar-Zähler-Badge, rollenabhängiger Autorenkennung und Lösch-Funktion im Admin-Modus; in `TicketList` für jedes Ticket eingebunden
- **Frontend – API-Client**: Drei neue Funktionen (`listComments`, `createComment`, `deleteComment`) inkl. `Comment`-Typ in `api.ts`
- **Demo-Reset**: Der `/reset`-Endpunkt löscht nun vor dem Neu-Seeden auch alle Kommentare und setzt den `sqlite_sequence`-Zähler zurück

---

## Neue API-Endpunkte

| Methode  | Pfad                                          | Beschreibung                                       | Parameter / Body                                                                 |
|----------|-----------------------------------------------|----------------------------------------------------|----------------------------------------------------------------------------------|
| `GET`    | `/tickets/{ticket_id}/comments`               | Alle Kommentare eines Tickets (chronologisch)      | `ticket_id` (Path, int)                                                          |
| `POST`   | `/tickets/{ticket_id}/comments`               | Neuen Kommentar anlegen                            | `ticket_id` (Path, int) · Body: `body` (str, 1–2000 Zeichen), `author` (str, optional, Default: `"Mitarbeiter"`) |
| `DELETE` | `/tickets/{ticket_id}/comments/{comment_id}`  | Kommentar löschen (nur Admin)                      | `ticket_id`, `comment_id` (Path, int)                                            |

**Validierungsregeln:**
- `body` darf nach Strip nicht leer sein → `422 Unprocessable Entity`
- Ungültiger `author`-Wert wird automatisch auf `"Mitarbeiter"` zurückgesetzt (Whitelist: `Mitarbeiter`, `IT-Admin`)
- Nicht gefundenes Ticket oder Kommentar → `404 Not Found`

---

## Tests

### Backend – Pytest (`backend/tests/test_api.py`) — 14 neue Tests

| Test | Was wird geprüft |
|------|-----------------|
| `test_list_comments_empty` | Leere Liste für neues Ticket (`[]`) |
| `test_list_comments_ticket_not_found` | `404` bei unbekannter `ticket_id` |
| `test_create_comment` | Erfolgreiche Erstellung, Rückgabe aller Felder (`id`, `body`, `author`, `ticket_id`, `created_at`) |
| `test_create_comment_admin_author` | `IT-Admin` als Autor wird korrekt gespeichert |
| `test_create_comment_invalid_author_falls_back_to_mitarbeiter` | Ungültiger Autor → Fallback auf `"Mitarbeiter"` |
| `test_create_comment_empty_body` | Leerer Body (nur Whitespace) → `422` |
| `test_create_comment_ticket_not_found` | `404` bei unbekannter `ticket_id` |
| `test_list_comments_returns_all` | Mehrere Kommentare werden in chronologischer Reihenfolge zurückgegeben |
| `test_delete_comment` | Löschen erfolgreich (`204`), Kommentar danach nicht mehr in der Liste |
| `test_delete_comment_not_found` | `404` bei unbekannter `comment_id` |
| `test_delete_comment_wrong_ticket` | `404` wenn `comment_id` zu einem anderen Ticket gehört |
| `test_delete_ticket_cascades_comments` | Ticket-Löschung kaskadiert auf Kommentare (FK `ON DELETE CASCADE`) |
| `test_reset_clears_comments` | `/reset` löscht alle Kommentare; Seed-Tickets haben leere Kommentarlisten |

### Frontend – Playwright E2E (`frontend/tests/helpdesk.spec.ts`) — 6 neue Tests + 2 aktualisierte Tests

| Test | Was wird geprüft |
|------|-----------------|
| `Kommentar-Bereich ist standardmäßig eingeklappt` | Toggle-Button sichtbar, `comment-list` initial nicht sichtbar |
| `Kommentar-Bereich öffnen und "Noch keine Kommentare" sehen` | Nach Klick auf Toggle: `comment-list` + `no-comments`-Hinweis sichtbar |
| `Kommentar erstellen und anzeigen` | Eingabe, Absenden, Darstellung von `body` und `author` im `comment-item` |
| `Kommentar-Zähler im Toggle-Button erscheint nach Kommentar` | Nach Schließen des Bereichs zeigt der Toggle-Button die Kommentaranzahl |
| `Admin kann Kommentar löschen` | Admin-Ansicht: Kommentar hinzufügen, per `comment-delete`-Button löschen, `no-comments` erscheint |
| *(aktualisiert)* `Ticket erstellen` | Status-Badge via `data-testid="ticket-status-badge"` geprüft statt rohem `[open]`-String |
| *(aktualisiert)* `Ticket schliessen` | Status-Badge ebenfalls über `data-testid` selektiert |

---

## Deployment-Hinweise

### Datenbank-Migration
Die neue `comments`-Tabelle wird bei **jedem App-Start** automatisch via `CREATE TABLE IF NOT EXISTS` angelegt (`backend/database.py → init_db()`). **Kein manuelles Migrations-Skript erforderlich.**

> ⚠️ **Wichtig für bestehende Produktiv-DBs:** `PRAGMA foreign_keys = ON` ist ab diesem Release aktiv. Sicherstellen, dass keine verwaisten Fremdschlüssel in der bestehenden `tickets`-Tabelle existieren, bevor deployed wird.

### Neue Umgebungsvariablen
Keine neuen Umgebungsvariablen erforderlich.

### Neue Abhängigkeiten
Keine neuen Python- oder npm-Pakete; die Implementierung nutzt ausschließlich bereits vorhandene Dependencies (`FastAPI`, `Pydantic`, `SQLite`, `React`).

### Demo-Reset
Der `/reset`-Endpunkt löscht jetzt zuerst `comments`, dann `tickets` und setzt beide `sqlite_sequence`-Einträge zurück. Bestehende Seed-Daten bleiben unverändert; Kommentare werden nach einem Reset **nicht** neu befüllt.
