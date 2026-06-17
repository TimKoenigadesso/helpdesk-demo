# Feature: Melder-Namensfeld bei Ticket-Erstellung (AGSDLC-17)

## Was wurde implementiert

- **Optionales Namensfeld im Ticket-Formular**: Nutzer können beim Erstellen eines Tickets ihren Namen (Vor- und Nachname) angeben; das Feld ist nicht verpflichtend.
- **Backend-Persistierung**: Das Feld `reporter_name` wurde als nullable `TEXT`-Spalte per `ALTER TABLE`-Migration zur SQLite-Datenbank hinzugefügt; leere / rein-whitespace Eingaben werden serverseitig als `NULL` gespeichert; Whitespace am Rand wird automatisch getrimmt.
- **Pydantic-Validierung**: `TicketCreate`- und `Ticket`-Modell wurden um `reporter_name: Optional[str] = Field(default=None, max_length=100)` erweitert; Eingaben über 100 Zeichen werden mit HTTP 422 abgelehnt.
- **Frontend-Anzeige**: Wurde ein Name angegeben, erscheint er in der Ticket-Karte der Übersichtsliste mit einem Personen-Icon und dem Präfix „Gemeldet von:"; fehlt der Name, bleibt dieser Bereich vollständig ausgeblendet.
- **TypeScript-Interface & API-Client**: `Ticket`-Interface und `createTicket()`-Signatur in `api.ts` wurden um das optionale Feld `reporter_name` ergänzt.

## Neue API-Endpunkte

Kein neuer Endpunkt – bestehender Endpunkt wurde erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen (erweitert) | **Body (JSON):** `title` *(string, required)*, `description` *(string, required)*, `priority` *(string, optional, default: `"medium"`)*, `reporter_name` *(string, optional, max. 100 Zeichen, default: `null`)* |
| `GET` | `/tickets` | Ticket-Liste abrufen (erweitert) | Antwort enthält jetzt `reporter_name` pro Ticket-Objekt |
| `GET` | `/tickets/{id}` | Einzelticket abrufen (erweitert) | Antwort enthält jetzt `reporter_name` |

**Beispiel-Request:**
```json
POST /tickets
{
  "title": "Login funktioniert nicht",
  "description": "Fehlermeldung beim Einloggen seit heute Morgen.",
  "priority": "high",
  "reporter_name": "Max Mustermann"
}
```

**Beispiel-Response (201 Created):**
```json
{
  "id": 42,
  "title": "Login funktioniert nicht",
  "description": "Fehlermeldung beim Einloggen seit heute Morgen.",
  "status": "open",
  "priority": "high",
  "category": "uncategorized",
  "reporter_name": "Max Mustermann",
  "ai_suggestion": null,
  "created_at": "2025-01-15T10:30:00",
  "updated_at": "2025-01-15T10:30:00"
}
```

## Tests

### Backend-Tests (`backend/tests/test_api.py`) – 9 neue Pytest-Fälle

| Testfall | Prüft |
|----------|-------|
| `test_create_ticket_with_reporter_name` | Name wird korrekt gespeichert und in der Response zurückgegeben |
| `test_create_ticket_without_reporter_name` | Fehlendes Feld → `reporter_name` ist `null` in der Response |
| `test_create_ticket_reporter_name_empty_string_stored_as_null` | Whitespace-only-Eingabe (`"   "`) wird als `null` persistiert |
| `test_reporter_name_persisted_in_detail_view` | Name ist in der Einzelticket-Detailansicht (`GET /tickets/{id}`) vorhanden |
| `test_reporter_name_visible_in_list` | Name erscheint in der Ticket-Übersichtsliste (`GET /tickets`) |
| `test_reporter_name_max_length_exactly_100` | Genau 100 Zeichen werden akzeptiert (HTTP 201) |
| `test_reporter_name_max_length_exceeded` | 101 Zeichen werden abgelehnt (HTTP 422) |
| `test_reporter_name_trimmed_on_save` | Führende/nachfolgende Leerzeichen werden serverseitig entfernt |
| `test_ticket_without_name_has_null_reporter` | `reporter_name` ist in Create-, Detail- und List-Response konsistent `null` |

### E2E-Tests (`frontend/tests/helpdesk.spec.ts`) – 5 neue Playwright-Szenarien

| Testfall | Prüft |
|----------|-------|
| `Namensfeld ist im Formular sichtbar und optional` | Input mit `data-testid="reporter-name"` ist sichtbar; Formular kann ohne Namenseingabe abgeschickt werden |
| `Ticket mit Namen erstellen und Name in Übersicht anzeigen` | Nach dem Submit erscheint der Name in `reporter-name-display` der Ticket-Karte |
| `Namensfeld wird nach Absenden geleert` | Input-Wert ist nach erfolgreichem Submit wieder leer (Reset-Verhalten) |
| `Validierungsfehler bei Name über 100 Zeichen` | `reporter-name-error` ist sichtbar und enthält „100 Zeichen" als Hinweistext |
| `Ticket ohne Namen zeigt keinen Melder-Bereich` | `reporter-name-display` ist bei anonymen Tickets nicht sichtbar |

## Deployment-Hinweise

### Datenbank-Migration
Die Migration erfolgt **automatisch** beim Anwendungsstart via `ALTER TABLE tickets ADD COLUMN reporter_name TEXT` in `backend/database.py`. Die Spalte ist nullable – bestehende Tickets erhalten automatisch `NULL` und sind nicht betroffen. **Kein manueller Migrations-Schritt notwendig.**

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine neuen Pakete. Die `max_length`-Validierung nutzt das bereits vorhandene `pydantic`-`Field`.

### Rollback
Im Fehlerfall genügt ein Revert des Feature-Branch. Die zusätzliche DB-Spalte ist rückwärtskompatibel – ein Entfernen der Spalte in SQLite erfordert einen manuellen `CREATE TABLE … AS SELECT`-Workaround (SQLite unterstützt kein `DROP COLUMN` vor Version 3.35).
