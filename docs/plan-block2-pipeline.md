# Plan Block 2: Pipeline-Fixes

## Ziel
Drei konkrete Bugs in `.gitlab-ci.yml` beheben + Dokumentationsgenerierung erganzen.

## Akzeptanzkriterien
- [ ] test-e2e lauft erfolgreich (Backend + Frontend erreichbar)
- [ ] claude-implement bekommt Confluence-Kontext in den Prompt
- [ ] create-merge-request setzt Jira-Status auf "Ready for Review"
- [ ] create-merge-request generiert FEATURE_DOCS.md und committet sie
- [ ] fix-iteration prueft nach dem Fix beide Test-Typen

---

## Bug 1: test-e2e — kein Server gestartet

**Problem:** Der Playwright-Job startet Backend und Frontend nicht.
Tests versuchen gegen nichts laufendes zu testen — fail sofort.

**Loesung:** `before_script` im `test-e2e` Job erweitern:

```yaml
test-e2e:
  image: mcr.microsoft.com/playwright:v1.44.0-jammy
  before_script:
    - git fetch origin && git checkout "feature/$JIRA_TICKET_ID"
    # Python + Backend-Abhaengigkeiten
    - pip install -q fastapi uvicorn pydantic anthropic
    # Backend im Hintergrund starten
    - cd backend
    - DB_PATH=/tmp/e2e.db ANTHROPIC_VERTEX_PROJECT_ID=mock
      uvicorn main:app --host 0.0.0.0 --port 8000 &
    - cd ..
    # Frontend bauen und servieren
    - cd frontend && npm ci
    - VITE_API_URL=http://localhost:8000 npm run build
    - npx serve dist --listen 5173 &
    - cd ..
    # Auf Backend warten (max 30s)
    - |
      for i in $(seq 1 15); do
        curl -sf http://localhost:8000/health && break || sleep 2
      done
    - npx playwright install --with-deps chromium
  script:
    - FRONTEND_URL=http://localhost:5173 npx playwright test --reporter=list
  artifacts:
    when: always
    paths: [playwright-report/, test-results/]
    expire_in: 1 hour
```

Ausserdem: `serve` in frontend/package.json als devDependency (`"serve": "^14.2.0"`).

---

## Bug 2: claude-implement — kein Confluence-Kontext

**Problem:** Der Agent kennt nur die Jira-Beschreibung, hat aber keinen
Architektur-/API-Kontext aus Confluence.

**Loesung:** Vor dem Claude-Aufruf Confluence-Seiten laden:

```bash
# Confluence-Seiten laden (tolerant gegen Fehler)
CONF_CONTEXT=""
if [ -n "$CONFLUENCE_BASE_URL" ] && [ -n "$CONFLUENCE_SPACE_KEY" ]; then
  CONF_RAW=$(curl -sf \
    -H "Authorization: Basic $(echo -n "$JIRA_USER_EMAIL:$CONFLUENCE_API_TOKEN" | base64 -w0)" \
    -H "Accept: application/json" \
    "$CONFLUENCE_BASE_URL/wiki/rest/api/content/search?cql=type=page+AND+space=\"$CONFLUENCE_SPACE_KEY\"&limit=3&expand=body.view" \
    2>/dev/null || echo '{"results":[]}')
  CONF_CONTEXT=$(echo "$CONF_RAW" | python3 -c "
import sys, json, re
pages = json.load(sys.stdin).get('results', [])
out = []
for p in pages:
    title = p.get('title', '')
    html = p.get('body', {}).get('view', {}).get('value', '')
    text = re.sub('<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()[:600]
    out.append(f'### {title}\n{text}')
print('\n\n'.join(out)[:4000])
" 2>/dev/null || echo "")
fi
```

Den Prompt in `claude --dangerouslySkipPermissions ... -p "..."` erweitern:

```
CONFLUENCE-KONTEXT (Architektur-Dokumentation):
${CONF_CONTEXT:-"Nicht verfuegbar"}
```

Neue CI/CD-Variablen benoetigt:
- `CONFLUENCE_BASE_URL` (z.B. https://yourcompany.atlassian.net)
- `CONFLUENCE_SPACE_KEY` (z.B. DEMO)
- `CONFLUENCE_API_TOKEN` (kann gleich `JIRA_API_TOKEN` sein bei Atlassian Cloud)

---

## Bug 3: create-merge-request — kein Jira-Status, keine Doku

**Problem A:** Ticket bleibt nach MR-Erstellung auf "In Progress".

**Loesung A:** Jira-Status-Transition nach MR-Erstellung:

```bash
# Verfuegbare Transitions laden
TRANSITIONS=$(curl -sf \
  -u "$JIRA_USER_EMAIL:$JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/3/issue/$JIRA_TICKET_ID/transitions" \
  || echo '{"transitions":[]}')

# Transition-ID fuer "Ready for Review" (oder "In Review") finden
TRANSITION_ID=$(echo "$TRANSITIONS" | python3 -c "
import sys, json
for t in json.load(sys.stdin).get('transitions', []):
    name = t['name'].lower()
    if any(k in name for k in ['review', 'ready', 'done', 'bereit']):
        print(t['id'])
        break
" 2>/dev/null || echo "")

if [ -n "$TRANSITION_ID" ]; then
  curl -sf -X POST \
    -u "$JIRA_USER_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/issue/$JIRA_TICKET_ID/transitions" \
    -d "{\"transition\":{\"id\":\"$TRANSITION_ID\"}}" \
    && echo "Status auf Ready for Review gesetzt" || echo "Status-Transition fehlgeschlagen (nicht kritisch)"
fi
```

**Problem B:** Keine Feature-Dokumentation wird generiert.

**Loesung B:** Claude generiert FEATURE_DOCS.md vor dem MR:

```bash
# Neuen Branch-Stand holen
git fetch origin && git checkout "feature/$JIRA_TICKET_ID"

# Dokumentation generieren
claude --dangerouslySkipPermissions \
  --allowedTools "Read,Write,Glob" \
  --max-turns 15 \
  -p "Lies die implementierten Aenderungen (git diff main...HEAD) und schreibe
  eine praegnante Feature-Dokumentation nach docs/FEATURE_DOCS.md.

  Inhalt:
  # Feature: [Titel aus Jira $JIRA_TICKET_ID]

  ## Was wurde implementiert
  [3-5 Stichpunkte]

  ## Neue API-Endpunkte
  [Tabelle: Methode | Pfad | Beschreibung]

  ## Tests
  [Welche Tests wurden ergaenzt]

  ## Deployment-Hinweise
  [Eventuelle DB-Migrationen oder Env-Variablen]"

# Committen und pushen
git add docs/FEATURE_DOCS.md
git commit -m "docs($JIRA_TICKET_ID): feature documentation" || true
git push origin "feature/$JIRA_TICKET_ID" --force-with-lease || true
```

---

## Zusatz: fix-iteration — nur Backend-Tests geprueft

**Problem:** Nach dem Fix werden nur `pytest`-Tests geprueft, nicht E2E.

**Loesung:** Fix-Job laeuft auch Playwright nach dem Bugfix-Commit.
Nur einen schnellen Smoke-Test (1 Test) um Iterationszeit zu halten:

```bash
# Nach dem Fix: Backend-Tests
cd backend && python -m pytest tests/ -v
# Und mindestens Smoke-E2E
cd .. && FRONTEND_URL=http://localhost:5173 npx playwright test --grep "Startseite" || true
```

---

## Zusammenfassung der Aenderungen an .gitlab-ci.yml

| Job | Aenderung |
|-----|-----------|
| `test-e2e` | before_script: Backend + Frontend starten, serve hinzufuegen |
| `claude-implement` | script: Confluence-Kontext laden, in Prompt injizieren |
| `create-merge-request` | script: Doku generieren, Status-Transition, MR-Kommentar erweitern |
| `fix-iteration` | script: nach Fix auch minimalen E2E-Smoke-Test ausfuehren |

Neue CI/CD-Variablen (in GitLab hinterlegen):
- `CONFLUENCE_BASE_URL`
- `CONFLUENCE_SPACE_KEY`
- `CONFLUENCE_API_TOKEN`
