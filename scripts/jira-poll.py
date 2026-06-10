#!/usr/bin/env python3
"""
Jira Polling Script — Re-Trigger agentic Pipeline
Wird alle 10 Minuten von GitHub Actions ausgeführt.

Sucht AGSDLC-Tickets die:
1. Status = "Zu erledigen" (= zurückgestellt / Req definiert)
2. Label = "agentic-delivery"
3. Kommentar in den letzten 20 Minuten

Und startet für diese eine neue GitHub Actions Pipeline.
"""
import os
import json
import urllib.request
import urllib.parse
import urllib.error
import base64
from datetime import datetime, timezone, timedelta

# ── Konfiguration aus Env-Vars ────────────────────────────────────────────────

JIRA_USER    = os.environ.get("JIRA_USER", "")
JIRA_TOKEN   = os.environ.get("JIRA_API_TOKEN", "")
JIRA_URL     = os.environ.get("JIRA_URL", "https://adesso-group.atlassian.net")
GH_TOKEN     = os.environ.get("GH_TOKEN", "")
GH_REPO      = os.environ.get("GH_REPO", "TimKoenigadesso/helpdesk-demo")
WORKFLOW     = "pipeline.yml"
LOOKBACK_MIN = int(os.environ.get("LOOKBACK_MINUTES", "20"))

# Status-Namen die eine erneute Implementierung ausloesen
RETRIGGER_STATUSES = {"zu erledigen", "req definiert", "idee", "zu spezifizieren"}

# ── Jira API Helper ───────────────────────────────────────────────────────────

def jira_get(path: str) -> dict:
    auth = base64.b64encode(f"{JIRA_USER}:{JIRA_TOKEN}".encode()).decode()
    url = f"{JIRA_URL}{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Basic {auth}",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  Jira API Error {e.code}: {e.read()[:200]}")
        return {}
    except Exception as e:
        print(f"  Jira Fehler: {e}")
        return {}


def trigger_pipeline(ticket_key: str) -> bool:
    url = f"https://api.github.com/repos/{GH_REPO}/actions/workflows/{WORKFLOW}/dispatches"
    data = json.dumps({
        "ref": "main",
        "inputs": {
            "pipeline_type": "agentic-feature",
            "jira_ticket_id": ticket_key,
        },
    }).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {GH_TOKEN}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
    }, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 204
    except urllib.error.HTTPError as e:
        print(f"  GitHub Fehler {e.code}: {e.read()[:200]}")
        return False


# ── Hauptlogik ────────────────────────────────────────────────────────────────

def main():
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=LOOKBACK_MIN))
    cutoff_str = cutoff.strftime("%Y-%m-%d %H:%M")

    # JQL: Tickets zurück auf "Zu erledigen" mit aktuellem Kommentar + Label
    jql = (
        'project = AGSDLC '
        'AND status = "Zu erledigen" '
        f'AND comment > "{cutoff_str}" '
        'AND labels = "agentic-delivery" '
        'ORDER BY updated DESC'
    )
    params = urllib.parse.urlencode({
        "jql": jql,
        "maxResults": 10,
        "fields": "summary,status,comment,labels,updated",
    })
    result = jira_get(f"/rest/api/3/search?{params}")
    issues = result.get("issues", [])

    print(f"[jira-poll] Prüfe Tickets seit {cutoff_str} UTC")
    print(f"[jira-poll] Gefundene Re-Trigger Tickets: {len(issues)}")

    triggered = 0
    for issue in issues:
        key = issue["key"]
        summary = issue["fields"].get("summary", "")
        status_name = issue["fields"].get("status", {}).get("name", "").lower()
        labels = issue["fields"].get("labels", [])
        updated = issue["fields"].get("updated", "")

        # Doppel-Check: Status muss wirklich "Zu erledigen" sein
        if status_name not in RETRIGGER_STATUSES:
            print(f"  {key}: Status '{status_name}' ignoriert")
            continue

        # Label muss 'agentic-delivery' enthalten
        if "agentic-delivery" not in labels:
            print(f"  {key}: Kein agentic-delivery Label, übersprungen")
            continue

        # Kommentare prüfen: letzter Kommentar muss nach cutoff sein
        comments = issue["fields"].get("comment", {}).get("comments", [])
        if not comments:
            # Kommentare separat laden
            comment_data = jira_get(f"/rest/api/3/issue/{key}/comment?orderBy=-created&maxResults=1")
            comments = comment_data.get("comments", [])

        recent_comment = False
        if comments:
            last_comment = comments[-1]
            created_str = last_comment.get("created", "")[:19].replace("T", " ").replace("+", "")
            try:
                created = datetime.strptime(created_str[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                recent_comment = created > cutoff
            except Exception:
                recent_comment = True  # Im Zweifel: trigger

        if not recent_comment:
            print(f"  {key}: Kein aktueller Kommentar, übersprungen")
            continue

        # Pipeline starten
        print(f"  Re-Trigger: {key} — {summary}")
        if trigger_pipeline(key):
            print(f"  ✓ Pipeline für {key} gestartet")
            triggered += 1
        else:
            print(f"  ✗ Pipeline-Start für {key} fehlgeschlagen")

    print(f"[jira-poll] {triggered} Pipeline(s) gestartet")


if __name__ == "__main__":
    main()
