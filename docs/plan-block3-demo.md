# Plan Block 3: Demo-Story

## Ziel
Die Demo narrativ vollstaendig machen: Claude Desktop Skill verfeinern,
Demo-Drehbuch schreiben und Confluence-Vorlage bereitstellen.

## Akzeptanzkriterien
- [ ] agentic-demo-skill.md beschreibt den vollstaendigen Ablauf inkl. Pipeline-Trigger
- [ ] demo-script.md gibt Presenter Schritt-fuer-Schritt-Anleitung
- [ ] confluence-architecture.md ist als Kontext-Seite fuer den Agenten bereit
- [ ] Demo-Feature "Ticket-Prioritaet setzen" ist klar definiert

---

## Das Demo-Feature

**Warum "Ticket-Prioritaet setzen"?**
- Ueberschaubar: 1 Backend-Endpoint + 1 Frontend-Dropdown + 2-3 Tests
- Zeigt den vollen Stack (API, DB, UI, Tests)
- Passt zum AI-Theme (Prioritaet kann danach mit KI vorbelegt werden)
- In < 15 Minuten vollstaendig implementierbar

**Was der Agent baut:**
1. Backend: `PATCH /tickets/{id}/priority` mit Validierung (low/medium/high/critical)
2. Frontend: Dropdown-Select im offenen Ticket zum manuellen Setzen
3. Tests: pytest-Test fuer den Endpoint + Playwright-Test fuer das Dropdown

**Demo-Jira-Story (Vorlage):**
```
Titel: Ticket-Prioritaet manuell setzbar machen

Als Support-Mitarbeiter moechte ich fuer jedes offene Ticket eine Prioritaet
(low / medium / high / critical) manuell setzen koennen, damit ich meine
Arbeitslast besser priorisieren kann.

Akzeptanzkriterien:
- [ ] PATCH /tickets/{id}/priority nimmt {"priority": "low|medium|high|critical"} entgegen
- [ ] Ungueltige Werte werden mit 422 abgelehnt
- [ ] Dropdown im Frontend zeigt aktuelle Prioritaet und erlaubt Aenderung
- [ ] Aenderung wird sofort gespeichert und angezeigt
- [ ] Unit-Test deckt happy path + Validierungsfehler ab
- [ ] Playwright-Test setzt Prioritaet ueber UI und prueft Anzeige

Story Points: 3
```

---

## Aenderung: agentic-demo-skill.md

Folgende Ergaenzungen:

1. **Schritt 5 erweitern** — nach Ticket-Erstellung erklaeren wie Pipeline gestartet wird:
   ```
   Naechster Schritt — Pipeline starten:
   Oeffne GitLab → CI/CD → Pipelines → "Run Pipeline"
   Setze Variablen:
     PIPELINE_TYPE = agentic-feature
     JIRA_TICKET_ID = [KEY]

   Die Pipeline laeuft ca. 15-20 Minuten und erstellt automatisch
   einen Merge Request.
   ```

2. **Einleitung** — Kontext fuer den Nutzer: Diese Skill erstellt eine Jira Story
   UND bereitet den agentischen Entwicklungsauftrag vor.

3. **Anhang** — Hinweis auf Confluence-Kontext: Wenn Architektur-Doku in
   Confluence vorhanden ist, wird sie automatisch vom Agenten genutzt.

---

## Neue Datei: docs/demo-script.md

Drehbuch fuer den Presenter (10-15 Minuten Demo):

### Phase 1: Anforderung (2 min)
- Claude Desktop oeffnen
- Natuerliche Sprache eingeben: "Ich brauche eine Moeglichkeit, Ticket-Prioritaeten zu setzen"
- Skill generiert Jira Story und zeigt sie an
- "Soll ich anlegen?" — Ja sagen

### Phase 2: Pipeline starten (1 min)
- GitLab aufrufen, Pipeline starten mit JIRA_TICKET_ID
- "Jetzt laeuft Claude Code komplett autonom..."

### Phase 3: Warten + erklaeren (5 min)
- Waehrend Pipeline laeuft: Demo-Flow erklaeren
- Pipeline-Stages zeigen (implement, test, fix, finalize)
- Logs live zeigen (claude-implement Stage)

### Phase 4: Ergebnis (3 min)
- Merge Request in GitLab zeigen
- Code-Diff zeigen (Backend + Frontend + Tests)
- Jira-Ticket: Status "Ready for Review", Kommentar mit MR-Link
- Feature-Doku in MR-Branch zeigen

### Phase 5: App zeigen (2 min)
- Docker-Compose starten (oder existierende Instanz)
- Prioritaet-Dropdown zeigen (vom Agenten gebaut)
- KI-Analyse starten

---

## Neue Datei: docs/confluence-architecture.md

Vorlage fuer die Confluence-Seite die den Coding-Agenten mit Kontext versorgt.

Inhalt:
- App-Uebersicht (FastAPI + SQLite + React + Vite)
- Datenbankschema (Tickets-Tabelle mit allen Feldern)
- API-Konventionen (REST, JSON, snake_case, Pydantic-Modelle)
- Frontend-Konventionen (React Functional Components, TypeScript, Tailwind)
- Test-Konventionen (pytest mit TestClient, Playwright mit data-testid)
- Umgebungsvariablen (DB_PATH, ANTHROPIC_VERTEX_PROJECT_ID, etc.)
- Verzeichnisstruktur

---

## Reihenfolge der Implementierung

1. `mcp-atlassian-adesso/skills/agentic-demo-skill.md` — Skill aktualisieren
2. `helpdesk-demo/docs/demo-script.md` — Drehbuch schreiben
3. `helpdesk-demo/docs/confluence-architecture.md` — Architektur-Vorlage
