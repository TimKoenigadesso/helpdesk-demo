# Plan Block 1: App Upgrade (UI + AI-Features)

## Ziel
Die Helpdesk-App demo-tauglich machen: professionelles UI mit Tailwind CSS
und KI-gestützte Ticket-Analyse via Anthropic Claude auf Vertex AI.

## Akzeptanzkriterien
- [ ] App sieht professionell aus (Tailwind, Karten, Badges)
- [ ] POST /tickets/{id}/analyze klassifiziert Kategorie + Priorität + Antwortvorschlag
- [ ] Frontend zeigt AI-Panel pro Ticket
- [ ] Analyse-Ergebnis wird in DB gespeichert und bleibt nach Reload erhalten
- [ ] Graceful Fallback wenn Vertex-Credentials fehlen (lokale Dev-Umgebung)
- [ ] Alle bestehenden Tests laufen weiterhin durch
- [ ] Neue Tests decken AI-Endpoint und UI-Panel ab

---

## Schritt 1: DB-Schema erweitern

**Datei:** `backend/database.py`

Neue Felder in CREATE TABLE:
- `category TEXT DEFAULT 'uncategorized'`
- `priority TEXT DEFAULT 'medium'`
- `ai_suggestion TEXT`

Ausserdem: ALTER TABLE Statements in `init_db()` fuer bestehende DBs (SQLite-kompatibel):
```sql
ALTER TABLE tickets ADD COLUMN category TEXT DEFAULT 'uncategorized';
ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE tickets ADD COLUMN ai_suggestion TEXT;
```
(schlagen fehl wenn Spalte schon existiert — mit try/except abfangen)

---

## Schritt 2: Pydantic-Modelle erweitern

**Datei:** `backend/models.py`

- `Ticket`: + `category`, `priority`, `ai_suggestion Optional[str]`
- `TicketUpdate`: + `category`, `priority`, `ai_suggestion`
- Neue Klasse `TicketAnalysis`: Rueckgabe-Schema fuer /analyze

---

## Schritt 3: AI-Endpoint in Backend

**Datei:** `backend/main.py`

Neuer Endpoint: `POST /tickets/{ticket_id}/analyze`

Ablauf:
1. Ticket aus DB laden (404 wenn nicht vorhanden)
2. Vertex AI Client initialisieren:
   ```python
   from anthropic import AnthropicVertex
   client = AnthropicVertex(
       project_id=os.environ["ANTHROPIC_VERTEX_PROJECT_ID"],
       region=os.environ.get("CLOUD_ML_REGION", "europe-west1"),
   )
   ```
3. Prompt an Claude schicken — Antwort als JSON:
   ```
   {"category": "bug|feature|question|access|infrastructure",
    "priority": "low|medium|high|critical",
    "suggestion": "Kurzantwort 1-2 Saetze"}
   ```
4. Ergebnis in DB speichern (UPDATE tickets SET ...)
5. Aktualisiertes Ticket zurueckgeben

**Fallback:** Wenn `ANTHROPIC_VERTEX_PROJECT_ID` nicht gesetzt,
Mock-Antwort zurueckgeben (fuer lokale Entwicklung).

**Dependency:** `anthropic[vertex]>=0.40.0` zu requirements.txt

---

## Schritt 4: Tailwind CSS einrichten

**Frontend-Paket-Aenderungen:**
```
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

**Neue Dateien:**
- `frontend/tailwind.config.js` — content: `['./index.html', './src/**/*.{ts,tsx}']`
- `frontend/postcss.config.js` — plugins: tailwindcss, autoprefixer

**Update:** `frontend/src/index.css` — Tailwind-Direktiven einfuegen

---

## Schritt 5: Frontend-Komponenten

### Neue Komponenten

**`frontend/src/components/PriorityBadge.tsx`**
- Props: `priority: 'low' | 'medium' | 'high' | 'critical'`
- Farben: low=blau, medium=gelb, high=orange, critical=rot
- Tailwind-Klassen: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium`

**`frontend/src/components/CategoryTag.tsx`**
- Props: `category: string`
- Grau hinterlegt, kleines Label

**`frontend/src/components/AiPanel.tsx`**
- Props: `ticketId: number`, `suggestion: string | null`, `onAnalyzed: () => void`
- Button "KI analysieren" → ruft `api.analyzeTicket(id)` → zeigt Ergebnis
- Loading-State mit Spinner
- Suggestion-Text in grauem Info-Box

### Bestehende Komponenten anpassen

**`frontend/src/components/TicketForm.tsx`**
- Inline-Styles durch Tailwind-Klassen ersetzen
- Karten-Optik: `bg-white rounded-xl shadow-sm border border-gray-200 p-6`

**`frontend/src/components/TicketList.tsx`**
- Inline-Styles durch Tailwind ersetzen
- PriorityBadge + CategoryTag pro Ticket einbauen
- AiPanel pro Ticket einbauen (wenn status=open)
- "Schliessen"-Button: rotes Outline-Button-Design

**`frontend/src/App.tsx`**
- Body-Background: `bg-gray-50 min-h-screen`
- Header mit Logo-Bereich und Titel

### API-Client erweitern

**`frontend/src/api.ts`**
- Neue Funktion: `analyzeTicket(id: number): Promise<Ticket>`
- `Ticket`-Interface: `category`, `priority`, `ai_suggestion` Felder erganzen

---

## Schritt 6: Tests

### Backend (`backend/tests/test_api.py`)

Neuer Test: `test_analyze_ticket()`
- Ticket erstellen
- POST /tickets/{id}/analyze aufrufen
- Wenn Vertex-Credentials fehlen: Mock via `monkeypatch` / `unittest.mock.patch`
- Prueft: Response 200, Felder category/priority/ai_suggestion vorhanden

Neuer Test: `test_analyze_ticket_not_found()`
- POST /tickets/99999/analyze → 404

Bestehende Tests: Alle weiterhin gruen (DB-Migration nicht stoerend)

### E2E (`frontend/tests/helpdesk.spec.ts`)

Neuer Test: `KI-Analyse-Button ist sichtbar`
- Ticket erstellen
- `data-testid="analyze-button"` ist sichtbar

Neuer Test: `KI-Analyse zeigt Ergebnis` (nur wenn Backend erreichbar)
- Ticket erstellen
- analyze-button klicken
- `data-testid="ai-suggestion"` wird sichtbar

---

## Reihenfolge der Implementierung

1. `backend/database.py` — Schema + Migration
2. `backend/models.py` — Modelle
3. `backend/main.py` — /analyze Endpoint
4. `backend/requirements.txt` — anthropic[vertex]
5. Tailwind einrichten (package.json, config files, index.css)
6. `frontend/src/api.ts` — analyzeTicket
7. `frontend/src/components/PriorityBadge.tsx` — neu
8. `frontend/src/components/CategoryTag.tsx` — neu
9. `frontend/src/components/AiPanel.tsx` — neu
10. `frontend/src/components/TicketForm.tsx` — Tailwind-Refactor
11. `frontend/src/components/TicketList.tsx` — Tailwind + neue Komponenten
12. `frontend/src/App.tsx` — Layout-Update
13. `backend/tests/test_api.py` — neue Tests
14. `frontend/tests/helpdesk.spec.ts` — neue E2E-Tests
