# Feature: My-Music-Company Corporate Design Integration (AGSDLC-37)

## Was wurde implementiert

- **Neue `MmcTicketForm`-Komponente** (`frontend/src/components/MmcTicketForm.tsx`): Vollständiges Ticket-Einreichungsformular im Corporate Design von my-music-company.com (Primärfarbe `#C8102E`, Akzentgold `#E8B800`, Deep Black `#1A1A1A`) – ersetzt die bisherige generische `TicketForm` im User-Portal.
- **Branded Welcome-Banner** in `App.tsx`: Das bisherige Indigo-Gradient-Banner wurde durch ein MMC-Design-Banner (Corporate Red, Musiknoten-Logo-SVG, Gold-Akzent-Streifen) mit `data-testid="mmc-welcome-banner"` ersetzt; der Markenname `my-music-company` ist explizit sichtbar.
- **Clientseitige Namensvalidierung**: Das Formular erzwingt, dass Nutzer mindestens Vor- *oder* Nachname angeben; bei leerem Submit erscheint eine sofortige Inline-Fehlermeldung (`data-testid="mmc-name-error"`), die automatisch verschwindet, sobald ein Namensfeld befüllt wird.
- **MMC Tailwind Design Tokens** (`frontend/tailwind.config.js`): Neue `mmc.*`-Farbpalette (`mmc-primary`, `mmc-secondary`, `mmc-accent`, `mmc-primary-dark`, `mmc-primary-light` u.a.) sowie `fontFamily.mmc` (`Inter / system-ui`) als wiederverwendbare Utility-Klassen registriert.
- **Branded Erfolgs- und Footer-Bereich**: Nach erfolgreichem Submit erscheint eine MMC-gestaltete Bestätigungsmeldung (`data-testid="mmc-success-message"`) mit Markennamen und Erfolgs-Checkmark; ein Dark-Footer schließt das Formular mit Copyright-Hinweis ab. Alle Felder werden nach dem Submit zurückgesetzt.

## Neue API-Endpunkte

Keine neuen Endpunkte. Die bestehenden Endpunkte werden unverändert genutzt; die Felder `first_name` und `last_name` waren bereits seit AGSDLC-20 im Backend vorhanden.

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| `POST` | `/tickets` | Ticket erstellen (inkl. Namensfelder) | `title`* `string`, `description`* `string`, `priority` `string` (low\|medium\|high\|critical, default: `medium`), `first_name` `string` (optional, Backend trimmt Whitespace), `last_name` `string` (optional, Backend trimmt Whitespace) |
| `GET` | `/tickets` | Alle Tickets abrufen | – |
| `GET` | `/tickets/{id}` | Einzelticket abrufen | `id` `int` |

> \* Pflichtfeld · Felder ohne \* werden serverseitig als leerer String defaulted.

## Tests

### Backend – `backend/tests/test_api.py` (+9 neue Unit-Tests)

| Testfunktion | Was wird geprüft |
|---|---|
| `test_mmc_create_ticket_with_full_name` | Vor- und Nachname werden korrekt persistiert, HTTP 201 |
| `test_mmc_name_appears_in_ticket_overview` | Name des Melders erscheint in der `GET /tickets`-Liste |
| `test_mmc_name_appears_in_ticket_detail` | Name erscheint in der `GET /tickets/{id}`-Detailansicht |
| `test_mmc_ticket_without_name_still_accepted` | Anonyme Einreichung ohne Namensfelder liefert HTTP 201; Backend setzt `""` als Default |
| `test_mmc_name_whitespace_trimmed_on_submit` | Führende/trailing Leerzeichen werden serverseitig entfernt |
| `test_mmc_combined_name_with_all_priorities` | Namensübergabe funktioniert für alle vier Prioritätsstufen (low/medium/high/critical) |
| `test_mmc_ticket_status_defaults_to_open` | Neu erstellte MMC-Tickets haben immer `status: "open"` |
| `test_mmc_first_name_only_accepted` | Nur Vorname (ohne Nachname) wird akzeptiert; `last_name` ist `""` |
| `test_mmc_last_name_only_accepted` | Nur Nachname (ohne Vorname) wird akzeptiert; `first_name` ist `""` |

### E2E – `frontend/tests/helpdesk.spec.ts` (+10 neue Playwright-Tests)

| Testname | Was wird geprüft |
|---|---|
| `MMC-Formular ist sichtbar und hat Corporate-Design-Header` | `mmc-ticket-form`, `mmc-form-header` und `mmc-logo` sind sichtbar |
| `MMC Welcome-Banner wird im User-Portal angezeigt` | `mmc-welcome-banner` sichtbar und enthält Text `my-music-company` |
| `MMC-Formular zeigt Namensfelder an` | `ticket-first-name` und `ticket-last-name` sind im DOM sichtbar |
| `MMC-Formular zeigt Validierungsfehler bei leerem Namen und Absenden` | Bei Submit ohne Namen erscheint `mmc-name-error` mit dem Wort „Namen" |
| `MMC-Formular: Validierungsfehler verschwindet bei Namenseingabe` | Fehlermeldung blendet sich aus, sobald `ticket-first-name` befüllt wird |
| `MMC-Bestätigungsmeldung erscheint nach erfolgreicher Übermittlung` | `mmc-success-message` enthält „erfolgreich übermittelt" und „my-music-company" |
| `MMC-Bestätigungsmeldung: Ticket erscheint in der Übersicht nach Absenden` | Ticket-Karte mit Titel und separat angezeigten Namen (`ticket-first-name-display` / `ticket-last-name-display`) taucht in der Liste auf |
| `MMC-Formular: Nur Vorname reicht für erfolgreiche Übermittlung` | Submit mit nur `first_name` führt zu sichtbarer `mmc-success-message` |
| `MMC-Formular: Nur Nachname reicht für erfolgreiche Übermittlung` | Submit mit nur `last_name` führt zu sichtbarer `mmc-success-message` |
| `MMC-Formular: Felder werden nach Absenden zurückgesetzt` | Nach erfolgreichem Submit sind `ticket-title`, `ticket-first-name` und `ticket-last-name` leer |

## Deployment-Hinweise

**Datenbank-Migrationen:** Keine. Die Spalten `first_name` und `last_name` in der Tickets-Tabelle wurden bereits mit AGSDLC-20 eingeführt.

**Neue Umgebungsvariablen:** Keine.

**Neue Abhängigkeiten:** Keine neuen npm- oder Python-Pakete. Die Komponente nutzt ausschließlich bestehende Tailwind CSS-Utilities und React-Hooks.

**Tailwind-Konfiguration:** Die neuen `mmc.*`-Design-Tokens in `frontend/tailwind.config.js` sind rein additiv und breaking-change-frei. Ein Rebuild des Frontends (`npm run build`) ist erforderlich, damit die neuen Utility-Klassen im Production-Bundle enthalten sind.

**Hinweis zum Formular-Wechsel:** `TicketForm` ist weiterhin im Codebase vorhanden und kann für andere Mandanten/Portale weiterverwendet werden. Im User-Portal (`view === 'user'`) ist sie durch `MmcTicketForm` ersetzt worden.
