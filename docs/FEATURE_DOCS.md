# Feature: Prioritäts-Sortierung in der Ticket-Liste (AGSDLC-22)

## Was wurde implementiert

- **Interaktiver Sortier-Button** in der `TicketList`-Komponente: Ein 3-Zustands-Toggle (`keine Sortierung → absteigend → aufsteigend`) erlaubt es Nutzern, Tickets nach Priorität zu ordnen.
- **Prioritäts-Rangsystem** (`PRIORITY_RANK`): Kritisch (4) › Hoch (3) › Mittel (2) › Niedrig (1) – dient als Grundlage für die stabile, nicht-destruktive Sortierung auf Basis einer Kopie des Ticket-Arrays.
- **Korrigierte Prioritäts-Labels** in `PriorityBadge`: Die Anzeigetexte wurden auf korrekte deutsche Begriffe normiert (`Niedrig`, `Mittel`, `Hoch`, `Kritisch`), um Konflikte im Playwright Strict Mode zu beheben.
- **Visuelles Feedback** am Sortier-Button: Aktiver Zustand wird durch Indigo-Einfärbung hervorgehoben; Pfeilsymbole (↓ / ↑) und dynamische Labels machen den aktuellen Sortiermodus unmittelbar erkennbar.
- **Playwright auf v1.61.0 angehoben** (`@playwright/test`): Kompatibilität mit Ubuntu 24.04 (Noble) sichergestellt und als `devDependency` im Frontend registriert.

## Neue API-Endpunkte

> Dieses Feature ist rein frontend-seitig. Es wurden keine neuen Backend-Endpunkte eingeführt. Die bestehende API (`api.updateStatus`, `api.deleteTicket` etc.) bleibt unverändert.

| Methode | Pfad | Beschreibung | Parameter |
|---------|------|--------------|-----------|
| –       | –    | Keine neuen Endpunkte | – |

## Tests

Alle Tests befinden sich in `frontend/tests/helpdesk.spec.ts` (Playwright E2E):

| Test | Was wird geprüft |
|------|-----------------|
| `Prioritäts-Sortier-Button ist in der Ticket-Liste sichtbar` | Nach dem Erstellen mindestens eines Tickets ist das Element `[data-testid="sort-by-priority"]` im DOM sichtbar. |
| `Sortierung nach Priorität: absteigend dann aufsteigend wechseln` | Erstellt je ein Ticket mit Priorität `low` und `critical`. Überprüft den vollständigen Toggle-Zyklus des Buttons: 1. Klick → Label enthält `↓`, 2. Klick → Label enthält `↑`, 3. Klick → Label lautet `Priorität sortieren` (Reset). |

## Deployment-Hinweise

| Kategorie | Details |
|-----------|---------|
| **DB-Migrationen** | Keine – es wurden weder Tabellen noch Spalten verändert. |
| **Neue Env-Variablen** | Keine. |
| **Neue Abhängigkeiten** | `@playwright/test ^1.61.0` als `devDependency` im Frontend (`frontend/package.json`). Kein Einfluss auf den Produktions-Build. |
| **Build** | `tsconfig.app.tsbuildinfo` wurde durch den TypeScript-Compiler automatisch aktualisiert (neue Komponentenpfade durch Groß-/Kleinschreibungs-Normierung). Kein manueller Eingriff notwendig. |
| **Playwright-Installation** | CI/CD-Pipelines müssen `npx playwright install --with-deps` ausführen, um die aktualisierten Browser-Binaries (v1.61.0) zu erhalten. |
