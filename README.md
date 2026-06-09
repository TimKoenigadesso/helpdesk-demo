# Helpdesk Demo — adesso Agentic SDLC

Eine einfache Helpdesk-Webanwendung, die als Ziel-Projekt der **agentischen Entwicklungs-Pipeline** dient.
Claude Code implementiert Features automatisch, schreibt Tests und erstellt Merge Requests.

## Technologie-Stack

| Schicht | Technologie |
|---------|-------------|
| Backend | FastAPI (Python 3.12), SQLite |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Tests | pytest + httpx (Unit), Playwright (E2E) |
| KI-Analyse | Anthropic Claude via Vertex AI (europe-west1) |
| Container | Docker, docker-compose |

## Lokaler Start

```bash
docker compose up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Features

- Ticket erstellen, anzeigen, schliessen
- Kategorien: bug / feature / question / access / infrastructure
- Prioritäten: low / medium / high / critical
- **KI-Analyse**: Ticket automatisch klassifizieren + Antwortvorschlag generieren (Vertex AI)
- Workflow-Anleitung auf der Startseite mit Links zu Jira, GitLab, Confluence

## Agentische Pipeline

Die `.gitlab-ci.yml` implementiert den vollstaendigen agentischen SDLC:

```
1. claude-implement  →  Claude Code liest Jira-Ticket + Confluence + Code
2. test-unit         →  pytest (FastAPI TestClient)
3. test-e2e          →  Playwright (Backend + Frontend werden gestartet)
4. fix-iteration     →  Claude Code behebt Fehler (max. 3 Iterationen)
5. create-mr         →  Merge Request + Dokumentation + Jira "Ready for Review"
6. deploy            →  Cloud Run (Backend + Frontend)
7. reset-demo        →  Bereinigung nach Demo
```

### Pipeline starten (manuell)

GitLab → CI/CD → Pipelines → **Run Pipeline**

| Variable | Wert |
|----------|------|
| `PIPELINE_TYPE` | `agentic-feature` |
| `JIRA_TICKET_ID` | z.B. `DMBRD-42` |

### Demo zurücksetzen

| Variable | Wert |
|----------|------|
| `PIPELINE_TYPE` | `reset-demo` |

## Benötigte CI/CD-Variablen

In GitLab unter **Settings → CI/CD → Variables** hinterlegen:

| Variable | Beschreibung | Beispiel |
|----------|--------------|---------|
| `GCP_PROJECT_ID` | Google Cloud Projekt-ID | `adesso-genai-solunit-demo` |
| `GCP_SERVICE_ACCOUNT_KEY` | Service Account JSON (base64) | `eyJ0eXBlIjoic2VydmljZV9...` |
| `GCP_SA_EMAIL` | Service Account E-Mail | `claude-deploy@project.iam.gserviceaccount.com` |
| `JIRA_BASE_URL` | Jira-Instanz-URL | `https://adesso-group.atlassian.net` |
| `JIRA_USER_EMAIL` | Jira-Konto | `tim.koenig@adesso.de` |
| `JIRA_API_TOKEN` | Jira API Token | `ATATT3xFfGF0...` |
| `GITLAB_ACCESS_TOKEN` | GitLab Personal Access Token | `glpat-...` |
| `VITE_JIRA_URL` | Jira-URL für Frontend-Guide | `https://adesso-group.atlassian.net` |
| `VITE_CONFLUENCE_URL` | Confluence-URL (optional) | `https://adesso-group.atlassian.net` |

## Umgebungsvariablen (Backend)

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `DB_PATH` | `/app/db/helpdesk.db` | SQLite Datenbankpfad |
| `ANTHROPIC_VERTEX_PROJECT_ID` | — | GCP Projekt für Vertex AI |
| `CLOUD_ML_REGION` | `europe-west1` | Vertex AI Region |

## Architektur-Dokumentation

Für den Coding-Agenten liegt die vollständige Architektur-Dokumentation unter:
`docs/confluence-architecture.md` — diese Seite in Confluence hochladen für maximalen Kontext.

## Baseline-Tests

```bash
# Backend
cd backend && python -m pytest tests/ -v

# E2E (Backend muss laufen)
npx playwright test --reporter=list
```

Bestehende Tests dienen als Baseline für die agentische Pipeline.
Claude Code ergänzt Tests für jedes neue Feature.
