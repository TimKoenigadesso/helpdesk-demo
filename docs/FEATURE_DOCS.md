# Feature: Bananen-Software Kennzeichnung (AGSDLC-34)

## Was wurde implementiert

- **Neue React-Komponente `BananaSoftwareCheckbox`** im REWE-Design (Primärfarbe `#cc0000`, Akzent Bananen-Gelb `#FFD700`): Ermöglicht das Markieren eines Tickets als „Bananen-Software" direkt in der Ticket-Liste mit visuellem Badge-Feedback und optimistischem UI-Update inkl. Rollback bei Fehler.
- **Neues Datenbankfeld `is_banana_software`** (`INTEGER NOT NULL DEFAULT 0`) in der `tickets`-Tabelle — wird sowohl bei Neuanlage als auch per `ALTER TABLE` (Migration für Bestandsdatenbanken) hinzugefügt.
- **Neuer dedizierter PATCH-Endpunkt** `PATCH /tickets/{ticket_id}/banana` zum gezielten Umschalten des Bananen-Software-Flags, ergänzend zur bestehenden allgemeinen `PUT /tickets/{ticket_id}`-Route, die ebenfalls um das neue Feld erweitert wurde.
- **Frontend-API-Client erweitert** (`api.ts`): Neues `is_banana_software`-Feld im `Ticket`-Interface sowie neue Methode `api.setBananaSoftware(ticketId, isBanana)`.
- **Barrierefreiheit (WCAG 2.1 AA)**: Checkbox ist als `role="checkbox"` mit `aria-checked`, `aria-label` und vollständiger Tastatursteuerung (Tab + Space/Enter) implementiert.

---

## Neue API-Endpunkte

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `PATCH` | `/tickets/{ticket_id}/banana` | Setzt oder entfernt die Bananen-Software-Markierung für ein einzelnes Ticket | **Path:** `ticket_id` (int) · **Body (JSON):** `{ "is_banana_software": true \| false }` |
| `PUT` | `/tickets/{ticket_id}` *(erweitert)* | Allgemeines Ticket-Update — neu unterstützt optional `is_banana_software` | **Path:** `ticket_id` (int) · **Body (JSON):** `{ ..., "is_banana_software": true \| false }` (optional) |
| `POST` | `/tickets` *(erweitert)* | Ticket erstellen — akzeptiert nun `is_banana_software` beim Erstellen | **Body (JSON):** `{ ..., "is_banana_software": false }` (optional, Default: `false`) |

> **Response** aller drei Endpunkte: vollständiges `Ticket`-Objekt inkl. `is_banana_software: bool`.  
> **Fehlerfall:** `404 Not Found`, wenn `ticket_id` nicht existiert.

---

## Tests

### Backend – `backend/tests/test_api.py` (12 neue Unit-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| `test_ticket_has_is_banana_software_field` | Neues Ticket enthält `is_banana_software: false` als Standard |
| `test_create_ticket_with_banana_software_true` | Ticket kann beim Erstellen mit `true` gesetzt werden |
| `test_create_ticket_with_banana_software_false` | Explizites `false` beim Erstellen funktioniert |
| `test_update_ticket_set_banana_software` | `PUT`-Route setzt Flag von `false` auf `true` |
| `test_update_ticket_unset_banana_software` | `PUT`-Route setzt Flag von `true` auf `false` |
| `test_banana_patch_endpoint_set_true` | `PATCH /banana` setzt auf `true` |
| `test_banana_patch_endpoint_set_false` | `PATCH /banana` setzt auf `false` |
| `test_banana_patch_endpoint_not_found` | `PATCH /banana` auf unbekannte ID → `404` |
| `test_banana_state_persists_in_list` | Markierung bleibt in `GET /tickets`-Listeantwort erhalten |
| `test_banana_state_persists_in_detail` | Markierung bleibt in `GET /tickets/{id}` erhalten |
| `test_banana_default_without_field` | Rückwärtskompatibilität: fehlendes Feld → Default `false` |
| `test_banana_toggle_via_patch` | Mehrfaches Umschalten (true → false → true) funktioniert korrekt |

### Frontend (E2E) – `frontend/tests/helpdesk.spec.ts` (7 neue Playwright-Tests)

| Testname | Was wird geprüft |
|----------|-----------------|
| *Bananen-Software Checkbox ist bei jedem Ticket sichtbar* | Container, Checkbox und Label werden nach Ticket-Erstellung gerendert |
| *Checkbox ist initial deaktiviert (aria-checked=false)* | Initiales `aria-checked="false"` auf neuem Ticket |
| *Aktivieren markiert Ticket und zeigt Badge* | Klick → `aria-checked="true"` + Badge „MARKIERT" erscheint |
| *Deaktivieren entfernt die Markierung* | Zweiter Klick → `aria-checked="false"` + Badge verschwindet |
| *Checkbox hat kein required-Attribut* | Als `<button>` kein `required`-Attribut vorhanden |
| *Tastatursteuerung (Tab + Space)* | Fokus + Space-Taste schaltet Zustand korrekt um |
| *aria-label für Barrierefreiheit* | `aria-label="Als Bananen-Software kennzeichnen"` und `role="checkbox"` gesetzt |

---

## Deployment-Hinweise

### Datenbankmigrationen
Die Migration läuft **automatisch beim Serverstart** (`init_db()`): Per `ALTER TABLE tickets ADD COLUMN is_banana_software INTEGER NOT NULL DEFAULT 0` wird das Feld zu bestehenden Datenbanken hinzugefügt. Neue Datenbanken erhalten das Feld direkt im `CREATE TABLE`. **Kein manueller Migrationsschritt nötig.**

### Neue Umgebungsvariablen
Keine neuen Umgebungsvariablen erforderlich.

### Neue Abhängigkeiten
Keine neuen Backend- oder Frontend-Pakete — die Implementierung nutzt ausschließlich vorhandene Abhängigkeiten (React, FastAPI, SQLite, Tailwind CSS).

### Rückwärtskompatibilität
- Bestehende Tickets ohne `is_banana_software`-Eintrag erhalten automatisch den Wert `false` (DB-Default).
- Bestehende API-Clients, die das Feld nicht senden, sind nicht betroffen — das Feld ist in allen Endpunkten optional.
