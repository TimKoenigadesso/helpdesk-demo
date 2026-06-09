# Helpdesk Demo — Architektur-Dokumentation

Diese Seite dient als Kontext-Dokument fuer den Coding-Agenten (Claude Code).
In Confluence hochladen unter Space: DEMO, Titel: "Helpdesk App - Architektur"

---

## Uebersicht

Einfache Helpdesk-Webanwendung zur Demonstration agentischer Softwareentwicklung.

- **Backend:** FastAPI (Python 3.12), SQLite, Pydantic v2
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v3
- **Tests:** pytest + httpx (Backend), Playwright (E2E)
- **Container:** Docker, docker-compose.yml

---

## Verzeichnisstruktur

```
helpdesk-demo/
  backend/
    main.py          — FastAPI App, alle Endpunkte
    models.py        — Pydantic-Modelle, VALID_PRIORITIES, VALID_CATEGORIES
    database.py      — SQLite-Verbindung (get_conn()), init_db()
    requirements.txt — Python-Abhaengigkeiten
    tests/
      test_api.py    — pytest Tests mit TestClient
  frontend/
    src/
      api.ts                    — Fetch-Client, Ticket-Interface
      App.tsx                   — Root-Komponente, Layout
      components/
        TicketForm.tsx          — Formular neues Ticket
        TicketList.tsx          — Liste mit allen Tickets
        PriorityBadge.tsx       — Farbige Prioritaets-Anzeige
        CategoryTag.tsx         — Kategorie-Label
        AiPanel.tsx             — KI-Analyse-Button + Ergebnis
    tests/
      helpdesk.spec.ts          — Playwright E2E Tests
  docs/                         — Dokumentation und Plaene
  .gitlab-ci.yml               — CI/CD Pipeline
```

---

## Datenbank-Schema

Tabelle: `tickets`

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| id | INTEGER PK | autoincrement | |
| title | TEXT NOT NULL | — | Kurztitel |
| description | TEXT NOT NULL | — | Beschreibung |
| status | TEXT | 'open' | open / closed |
| category | TEXT | 'uncategorized' | bug / feature / question / access / infrastructure |
| priority | TEXT | 'medium' | low / medium / high / critical |
| ai_suggestion | TEXT | NULL | KI-Antwortvorschlag |
| created_at | TEXT | datetime('now') | |
| updated_at | TEXT | datetime('now') | |

---

## API-Konventionen

- REST, JSON, snake_case fuer alle Felder
- Pydantic-Modelle in models.py fuer Validierung
- Validierung von Enums ueber VALID_PRIORITIES und VALID_CATEGORIES Sets
- 404 wenn Ressource nicht gefunden, 422 fuer ungueltige Felder
- Alle neuen Felder mit Validierung in models.py und update_ticket absichern

### Bestehende Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | /health | Health Check |
| GET | /tickets | Alle Tickets (absteigend nach Erstelldatum) |
| POST | /tickets | Neues Ticket erstellen |
| GET | /tickets/{id} | Einzelnes Ticket |
| PUT | /tickets/{id} | Ticket aktualisieren (alle Felder optional) |
| DELETE | /tickets/{id} | Ticket loeschen |
| POST | /tickets/{id}/analyze | KI-Analyse (Kategorie, Prioritaet, Antwortvorschlag) |

---

## Frontend-Konventionen

- React Functional Components mit TypeScript
- Tailwind CSS fuer alle Styles (keine inline-Styles)
- `data-testid` Attribute fuer alle interaktiven Elemente (Playwright nutzt sie)
- API-Aufruf immer ueber `api.ts` (nie direkt fetch aufrufen)
- Ticket-Interface in `api.ts` aktuell halten wenn neue Felder hinzukommen

### Bestehende data-testid Attribute
- `ticket-title` — Titel-Input im Formular
- `ticket-description` — Beschreibungs-Textarea
- `ticket-submit` — Submit-Button
- `ticket-item` — Jedes Ticket in der Liste
- `ticket-title-display` — Titel-Anzeige in der Liste
- `close-ticket` — Schliessen-Button
- `analyze-button` — KI-Analyse starten
- `ai-suggestion` — KI-Antwortvorschlag (erscheint nach Analyse)
- `empty-state` — Anzeige bei leerer Ticket-Liste

---

## Test-Konventionen

### Backend (pytest)
- TestClient aus fastapi.testclient
- DB_PATH auf /tmp/ setzen via database.DB_PATH
- Jeder Test bekommt frische DB (autouse fixture loescht nach Test)
- sys.modules Patching fuer externe Abhaengigkeiten ohne echte Credentials

### Frontend (Playwright)
- data-testid Attribute verwenden, keine CSS-Selektoren
- FRONTEND_URL Umgebungsvariable (default: http://localhost:5173)
- Backend muss erreichbar sein fuer Tests die Daten lesen/schreiben

---

## Umgebungsvariablen

| Variable | Kontext | Beschreibung |
|----------|---------|--------------|
| DB_PATH | Backend | Pfad zur SQLite-Datei (default: /app/db/helpdesk.db) |
| ANTHROPIC_VERTEX_PROJECT_ID | Backend | GCP Projekt-ID fuer Vertex AI |
| CLOUD_ML_REGION | Backend | GCP Region (default: europe-west1) |
| GOOGLE_APPLICATION_CREDENTIALS | Backend | Pfad zum Service Account Key |
| VITE_API_URL | Frontend Build | Backend-URL (default: http://localhost:8000) |
| FRONTEND_URL | Playwright | Frontend-URL (default: http://localhost:5173) |
