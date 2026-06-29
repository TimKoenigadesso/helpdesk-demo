# Feature: Reporter-Name für Tickets (AGSDLC-23)

## Was wurde implementiert

- **Neues Pflichtfeld `reporter_name`** im Ticket-Erstellungsformular: Melder können ihren vollständigen Namen (Vor- und Nachname kombiniert) als freies Textfeld angeben – optionales Feld, max. 100 Zeichen.
- **Backend-Datenmodell erweitert**: `reporter_name` (TEXT NOT NULL DEFAULT '') als neue Spalte in der SQLite-Tabelle `tickets`; via `ALTER TABLE`-Migration rückwärtskompatibel nachgezogen.
- **Serverseitige Validierung & Sanitisierung**: Pydantic-Validierung (`max_length=100`), serverseitiges Trimmen von Whitespace sowie hartes Kürzen auf 100 Zeichen als Defense-in-Depth.
- **Frontend-Validierung mit Live-Feedback**: Zeichenzähler (`n/100`) bei aktiver Eingabe, Inline-Fehlermeldung bei Überschreitung, visueller Fehler-State (rotes Border/Background), Submit-Sperre bei invalid.
- **`TicketList` zeigt `reporter_name` priorisiert**: Hat ein Ticket einen `reporter_name`, wird dieser in der „Gemeldet von"-Zeile bevorzugt angezeigt; andernfalls Fallback auf `first_name` / `last_name` (Abwärtskompatibilität).

---

## Neue API-Endpunkte

Kein neuer Endpunkt – bestehende Endpunkte wurden um den Parameter `reporter_name` erweitert:

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen | `reporter_name` *(optional, string, max. 100 Zeichen)* |
| `PUT` | `/tickets/{ticket_id}` | Ticket aktualisieren | `reporter_name` *(optional, string, max. 100 Zeichen)* |
| `GET` | `/tickets` | Alle Tickets abrufen | – (Antwort enthält `reporter_name`) |
| `GET` | `/tickets/{ticket_id}` | Einzelnes Ticket abrufen | – (Antwort enthält `reporter_name`) |

**Request-Body-Beispiel (`POST /tickets`):**
```json
{
  "title": "Login schlägt fehl",
  "description": "...",
  "priority": "high",
  "reporter_name": "Maria Muster"
}
```

**Response-Erweiterung:**
```json
{
  "id": 42,
  "reporter_name": "Maria Muster",
  "first_name": "",
  "last_name": "",
  ...
}
```

> **Hinweis:** `reporter_name > 100 Zeichen` → HTTP `422 Unprocessable Entity` (Pydantic-Validierungsfehler). `null` wird serverseitig als `""` behandelt.

---

## Tests

### Backend – `backend/tests/test_api.py` (10 neue Unit-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_create_ticket_with_reporter_name` | `reporter_name` wird korrekt gespeichert und zurückgegeben |
| `test_create_ticket_without_reporter_name_uses_empty_default` | Fehlender `reporter_name` ergibt leeren String (Abwärtskompatibilität) |
| `test_reporter_name_max_100_chars` | Genau 100 Zeichen werden akzeptiert (HTTP 201) |
| `test_reporter_name_exceeds_100_chars_returns_422` | 101 Zeichen werden abgelehnt (HTTP 422) |
| `test_reporter_name_visible_in_detail` | `reporter_name` erscheint im Einzel-Ticket-Endpoint |
| `test_reporter_name_visible_in_list` | `reporter_name` erscheint im Listen-Endpoint |
| `test_reporter_name_whitespace_stripped` | Führende/nachfolgende Leerzeichen werden serverseitig getrimmt |
| `test_update_ticket_reporter_name` | `reporter_name` kann via `PUT` nachträglich geändert werden |
| `test_reporter_name_with_priority` | `reporter_name` ist kompatibel mit allen Prioritäts-Feldern |
| `test_reporter_name_null_treated_as_empty` | `null`-Wert wird graceful als `""` behandelt |

### Frontend – `frontend/tests/helpdesk.spec.ts` (6 neue E2E-Tests mit Playwright)

| Testname | Was wird geprüft |
|----------|-----------------|
| `Reporter-Name-Feld ist im Formular sichtbar` | Eingabefeld mit `data-testid="ticket-reporter-name"` wird gerendert |
| `Reporter-Name-Feld hat kein required-Attribut` | Feld ist optional (kein HTML-`required`) |
| `Ticket ohne Reporter-Name kann ohne Fehler erstellt werden` | Leeres Feld blockiert Submit nicht |
| `Ticket mit Reporter-Name erstellen und in der Liste anzeigen` | Eingegebener Name erscheint via `ticket-reporter-name-display` in der Liste |
| `Reporter-Name über 100 Zeichen zeigt Validierungsfehlermeldung` | Inline-Error (`reporter-name-error`) bei > 100 Zeichen sichtbar |
| `Reporter-Name-Zeichenzähler erscheint bei Eingabe` | Counter (`reporter-name-counter`) zeigt korrektes Format `n/100` |
| `Formular-Felder inkl. Reporter-Name werden nach Absenden zurückgesetzt` | Alle Felder leer nach erfolgreichem Submit |

---

## Deployment-Hinweise

### Datenbank-Migration
- **Automatisch** – `init_db()` führt beim Start `ALTER TABLE tickets ADD COLUMN reporter_name TEXT NOT NULL DEFAULT ''` aus.
- Bestehende Tickets erhalten automatisch `reporter_name = ''` (SQLite-Default).
- **Kein manueller Migrations-Schritt notwendig**, jedoch sollte beim ersten Start nach dem Deployment die Anwendung neu gestartet werden, damit `init_db()` ausgeführt wird.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine – das Feature nutzt ausschließlich bestehende Bibliotheken (`pydantic`, `fastapi`, `react`, `tailwindcss`).

### Abwärtskompatibilität
- ✅ API vollständig abwärtskompatibel: `reporter_name` ist in allen Endpunkten optional.
- ✅ Bestehende Clients (ohne `reporter_name`) funktionieren unverändert.
- ✅ `TicketList` fällt auf `first_name`/`last_name` zurück, wenn `reporter_name` leer ist.
