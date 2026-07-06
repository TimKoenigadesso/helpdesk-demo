# Feature: Bananen-Software Checkbox im REWE-Design (AGSDLC-33)

## Was wurde implementiert

- **Neues Boolean-Feld `is_banana_software`** auf Ticket-Ebene: Tickets können als „Bananen-Software" gekennzeichnet werden; der Standardwert ist `false` (rückwärtskompatibel).
- **Neue React-Komponente `BananaSoftwareCheckbox`** im REWE-Marken-Design (Primärfarbe REWE-Rot `#cc0000`, Akzent Bananen-Gelb `#FFD700`): Custom-Checkbox mit Checkmark-SVG, Lade-Spinner, Badge „MARKIERT" und vollständiger Tastatursteuerung (Space / Enter).
- **Persistenz serverseitig**: Der Zustand wird via `PATCH /tickets/:id/banana` direkt in der SQLite-Datenbank gespeichert; optimistisches UI-Update mit automatischem Rollback bei Netzwerkfehler.
- **Barrierefreiheit (WCAG 2.1 AA)**: `role="checkbox"`, `aria-checked`, `aria-label="Als Bananen-Software kennzeichnen"`, vollständige Fokus-Ring-Unterstützung, alle interaktiven Elemente via `data-testid` adressierbar.
- **Integration in `TicketList`**: Die Checkbox erscheint bei jedem Ticket-Eintrag; Zustandsänderungen lösen ein globales Ticket-Reload (`onUpdated`-Callback) aus.

---

## Neue API-Endpunkte

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `PATCH` | `/tickets/{ticket_id}/banana` | Setzt oder entfernt die Bananen-Software-Markierung eines Tickets | **Path:** `ticket_id: int` · **Body (JSON):** `{ "is_banana_software": boolean }` |
| `POST` | `/tickets` *(erweitert)* | Ticket-Erstellung akzeptiert nun optional `is_banana_software` | **Body (JSON):** `is_banana_software?: boolean` (Default: `false`) |
| `PUT/PATCH` | `/tickets/{ticket_id}` *(erweitert)* | Ticket-Update akzeptiert nun optional `is_banana_software` | **Body (JSON):** `is_banana_software?: boolean \| null` |

**Responses:** Alle Endpunkte geben das vollständige `Ticket`-Objekt inkl. `is_banana_software: boolean` zurück. Nicht gefundene Ticket-IDs → `404 Not Found`.

---

## Tests

### Backend – `backend/tests/test_api.py` (7 neue Unit-Tests)

| Test | Was wird geprüft |
|------|-----------------|
| `test_banana_software_default_false` | Neues Ticket hat `is_banana_software = false` als Default |
| `test_banana_software_set_on_create` | `is_banana_software: true` beim Erstellen wird korrekt gespeichert |
| `test_banana_patch_endpoint` | `PATCH /tickets/:id/banana` schaltet den Wert auf `false` zurück |
| `test_banana_patch_endpoint_not_found` | Ungültige Ticket-ID liefert `404` |
| `test_banana_state_persists_in_list` | Markierung bleibt in der Ticket-Listenansicht (`GET /tickets`) erhalten |
| `test_banana_state_persists_in_detail` | Markierung bleibt in der Ticket-Detailansicht (`GET /tickets/:id`) erhalten |
| `test_banana_default_without_field` | Ohne `is_banana_software`-Feld im Body → Default `false` (Rückwärtskompatibilität) |
| `test_banana_toggle_via_patch` | Mehrfaches Umschalten (true → false → true) funktioniert korrekt |

### Frontend – `frontend/tests/helpdesk.spec.ts` (7 neue Playwright-E2E-Tests)

| Test | Was wird geprüft |
|------|-----------------|
| `Bananen-Software Checkbox ist bei jedem Ticket sichtbar` | Container, Checkbox und Label werden gerendert (`data-testid`) |
| `Checkbox ist initial deaktiviert (aria-checked=false)` | Standardzustand `aria-checked="false"` |
| `Checkbox aktivieren markiert Ticket und zeigt Badge` | Klick → `aria-checked="true"` + Badge „MARKIERT" erscheint |
| `Checkbox deaktivieren entfernt die Markierung` | Zweiter Klick → `aria-checked="false"` + Badge verschwindet |
| `Checkbox hat kein required-Attribut` | Button-Element trägt kein `required`-Attribut |
| `Checkbox ist per Tastatur bedienbar (Tab + Space)` | Fokus + Space-Taste → `aria-checked="true"` |
| `Checkbox hat aria-label für Barrierefreiheit` | `aria-label="Als Bananen-Software kennzeichnen"` + `role="checkbox"` vorhanden |

---

## Deployment-Hinweise

### Datenbank-Migration
Die Migration läuft **automatisch** beim Start via `init_db()` in `backend/database.py`:
```sql
ALTER TABLE tickets ADD COLUMN is_banana_software INTEGER NOT NULL DEFAULT 0;
```
Bestehende Tickets erhalten automatisch den Standardwert `0` (= `false`) – **keine manuelle Migration erforderlich**, vollständig rückwärtskompatibel.

### Neue Umgebungsvariablen
Keine.

### Neue Abhängigkeiten
Keine zusätzlichen Python-Pakete oder npm-Pakete erforderlich. Die Komponente nutzt ausschließlich bestehende Infrastruktur (React, Tailwind CSS, bestehende `fetch`-API-Wrapper).

### Frontend-Build
Die Datei `frontend/tsconfig.app.tsbuildinfo` wurde aktualisiert, da `BananaSoftwareCheckbox.tsx` als neue Komponente in den TypeScript-Build-Graph aufgenommen wurde. Kein manueller Eingriff nötig – wird beim nächsten `npm run build` automatisch berücksichtigt.
