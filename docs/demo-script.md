# Demo-Drehbuch: Agentische Software-Entwicklung

Gesamtdauer: ca. 20 Minuten
Zielgruppe: IT-Entscheider, Entwicklungsleiter, Product Owner

---

## Vorbereitung (vor der Demo)

- [ ] GitLab-Projekt geoeffnet und Pipeline-Ansicht bereit
- [ ] Claude Desktop geoeffnet mit geladenem Skill "agentic-demo"
- [ ] Helpdesk-App laeuft unter http://localhost:5173 (docker compose up)
- [ ] Jira-Board geoeffnet, kein altes Feature-Ticket sichtbar
- [ ] Demo zuvor mit PIPELINE_TYPE=reset-demo zurueckgesetzt

---

## Phase 1: Anforderung formulieren (2-3 min)

**Was du tust:**
Claude Desktop oeffnen. Den Skill "agentic-demo" aufrufen.

**Was du sagst:**
"Statt komplizierter Ticket-Templates schreibe ich einfach was ich will:"

**Eingabe (natuerliche Sprache):**
```
Ich brauche eine Moeglichkeit, Tickets manuell eine Prioritaet zu geben.
Also low, medium, high oder critical. Damit koennen Support-Mitarbeiter
wichtige Tickets schneller erkennen und bearbeiten.
```

**Was passiert:**
Claude analysiert die Anforderung und formuliert eine vollstaendige Jira User Story
mit INVEST-Kriterien, Akzeptanzkriterien und technischem Kontext.

**Was du zeigst:**
- Die automatisch generierte Story (Titel, User Story, DoD, Akzeptanzkriterien)
- "Das ist eine echte, testbare User Story — keine handgeschriebene."

**Bestaetigung:**
Claude fragt: "Soll ich das Ticket anlegen?" -> Ja sagen.

**Ergebnis:**
Ticket erscheint in Jira, z.B. DEMO-42

---

## Phase 2: Pipeline starten (1 min)

**Was du tust:**
GitLab aufrufen. CI/CD -> Pipelines -> "Run Pipeline"

**Variablen setzen:**
```
PIPELINE_TYPE = agentic-feature
JIRA_TICKET_ID = DEMO-42
```

**Was du sagst:**
"Ab jetzt laeuft Claude Code komplett autonom. Kein Entwickler schreibt eine Zeile Code."

---

## Phase 3: Live erklaeren waehrend Pipeline laeuft (8-10 min)

**Stage: implement (laeuft gerade)**

"Claude Code laeuft in einem Container in GitLab. Er liest gerade:
- Das Jira-Ticket mit allen Akzeptanzkriterien
- Die Architektur-Dokumentation aus Confluence
- Den bestehenden Quellcode"

Pipeline-Logs zeigen (implement-Stage):
- Man sieht wie Claude liest, plant, implementiert
- "Das ist kein Template — er versteht den Code und baut darauf auf"

**Stage: test**

"Jetzt laufen automatisch Tests — pytest fuer das Backend, Playwright fuer die Oberflaeche.
Die Tests hat Claude selbst geschrieben, basierend auf den Akzeptanzkriterien."

**Stage: fix (nur wenn noetig)**

"Wenn ein Test fehlschlaegt, behebt Claude den Fehler selbst und iteriert — bis zu 3 Mal."

---

## Phase 4: Ergebnis zeigen (3-4 min)

**Merge Request in GitLab zeigen:**
- Automatisch erstellter MR mit aussagekraeftigem Titel
- Code-Diff: Backend-Route, Frontend-Komponente, Tests
- "Das ist produktionsreifer Code — nicht nur ein Prototyp"

**Jira-Ticket zeigen:**
- Status: "Ready for Review"
- Kommentar mit MR-Link von Claude automatisch hinterlegt
- "Der Entwickler muss nur noch reviewen und mergen"

**Feature-Doku zeigen (docs/FEATURE_DOCS.md im Branch):**
- Automatisch generiert: Was wurde gebaut, neue Endpoints, Tests, Deployment-Hinweise

---

## Phase 5: App zeigen (2 min)

Docker Compose neu starten (Branch deployen) oder vorbereitete Instanz zeigen.

**Was du zeigst:**
- Prioritaets-Dropdown im Ticket (neu, vom Agenten gebaut)
- PriorityBadge in den Farben low/medium/high/critical
- KI-Analyse-Button -> Antwortvorschlag erscheint

**Was du sagst:**
"Vom natuerlichsprachlichen Wunsch bis zum laufenden Feature: 15-20 Minuten,
null Entwicklerzeit fuer die Implementierung."

---

## Haeufige Fragen

**"Was wenn der Agent einen Fehler macht?"**
Antwort: Fix-Loop laeuft bis zu 3 Mal automatisch. Danach eskaliert er an Jira.
Ein Mensch reviewed den Merge Request — das ist der Safety-Net.

**"Wie gut ist die Code-Qualitaet?"**
Antwort: Tests sind Pflicht. Ohne gruene Tests kein Merge Request. Konventionen
werden aus dem bestehenden Code gelernt.

**"Kann das komplexe Features?"**
Antwort: Fuer einen Sprint-Story-Scope (1-5 Story Points) sehr gut. Komplexe
Architektur-Entscheidungen bleiben beim Menschen.
