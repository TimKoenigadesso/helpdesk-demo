#!/usr/bin/env python3
"""
Agentic Coding Agent via Anthropic Vertex AI.
Ersatz fuer 'claude --dangerously-skip-permissions' in CI-Pipelines ohne Anthropic API Key.
Benoetigt: ANTHROPIC_VERTEX_PROJECT_ID, CLOUD_ML_REGION, GOOGLE_APPLICATION_CREDENTIALS
"""
import os
import sys
import json
import subprocess
import glob as globmod
import re
from pathlib import Path

# ── Vertex AI Client ──────────────────────────────────────────────────────────

def get_client():
    from anthropic import AnthropicVertex
    return AnthropicVertex(
        project_id=os.environ["ANTHROPIC_VERTEX_PROJECT_ID"],
        region=os.environ.get("CLOUD_ML_REGION", "europe-west1"),
    )

MODEL = os.environ.get("CLAUDE_AGENT_MODEL", "claude-sonnet-4-5@20251001")
MAX_TOKENS = int(os.environ.get("CLAUDE_AGENT_MAX_TOKENS", "8192"))

# ── Tool-Implementierungen ────────────────────────────────────────────────────

def tool_read(path: str, offset: int = 0, limit: int = 500) -> str:
    try:
        lines = Path(path).read_text(errors="replace").splitlines()
        selected = lines[offset : offset + limit]
        numbered = [f"{i + offset + 1}: {l}" for i, l in enumerate(selected)]
        return "\n".join(numbered)
    except Exception as e:
        return f"Error reading {path}: {e}"

def tool_write(path: str, content: str) -> str:
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)
        return f"Written: {path} ({len(content)} bytes)"
    except Exception as e:
        return f"Error writing {path}: {e}"

def tool_edit(path: str, old_string: str, new_string: str) -> str:
    try:
        text = Path(path).read_text()
        if old_string not in text:
            return f"Error: old_string not found in {path}"
        new_text = text.replace(old_string, new_string, 1)
        Path(path).write_text(new_text)
        return f"Edited: {path}"
    except Exception as e:
        return f"Error editing {path}: {e}"

def tool_bash(command: str, timeout: int = 120) -> str:
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=timeout
        )
        out = result.stdout[-8000:] if len(result.stdout) > 8000 else result.stdout
        err = result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr
        combined = out + (f"\nSTDERR:\n{err}" if err.strip() else "")
        if result.returncode != 0:
            combined += f"\n[exit code: {result.returncode}]"
        return combined.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return f"Error: command timed out after {timeout}s"
    except Exception as e:
        return f"Error: {e}"

def tool_glob(pattern: str) -> str:
    try:
        matches = globmod.glob(pattern, recursive=True)
        return "\n".join(sorted(matches)) or "(no matches)"
    except Exception as e:
        return f"Error: {e}"

def tool_grep(pattern: str, path: str = ".", include: str = "") -> str:
    try:
        cmd = ["grep", "-rn", "--include", include if include else "*", pattern, path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        out = result.stdout[:6000]
        return out.strip() or "(no matches)"
    except Exception as e:
        return f"Error: {e}"

# ── Tool-Definitionen (fuer Anthropic API) ────────────────────────────────────

TOOLS = [
    {
        "name": "Read",
        "description": "Read file contents. Returns line-numbered output.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "offset": {"type": "integer", "default": 0},
                "limit": {"type": "integer", "default": 500},
            },
            "required": ["path"],
        },
    },
    {
        "name": "Write",
        "description": "Write content to a file (creates directories as needed).",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "Edit",
        "description": "Replace first occurrence of old_string with new_string in a file.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "old_string": {"type": "string"},
                "new_string": {"type": "string"},
            },
            "required": ["path", "old_string", "new_string"],
        },
    },
    {
        "name": "Bash",
        "description": "Execute a bash command. Use for git, pytest, npm, etc.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "timeout": {"type": "integer", "default": 120},
            },
            "required": ["command"],
        },
    },
    {
        "name": "Glob",
        "description": "Find files matching a glob pattern (e.g. **/*.py).",
        "input_schema": {
            "type": "object",
            "properties": {"pattern": {"type": "string"}},
            "required": ["pattern"],
        },
    },
    {
        "name": "Grep",
        "description": "Search file contents with a regex pattern.",
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "path": {"type": "string", "default": "."},
                "include": {"type": "string", "default": ""},
            },
            "required": ["pattern"],
        },
    },
]

def execute_tool(name: str, inputs: dict) -> str:
    if name == "Read":
        return tool_read(inputs["path"], inputs.get("offset", 0), inputs.get("limit", 500))
    if name == "Write":
        return tool_write(inputs["path"], inputs["content"])
    if name == "Edit":
        return tool_edit(inputs["path"], inputs["old_string"], inputs["new_string"])
    if name == "Bash":
        return tool_bash(inputs["command"], inputs.get("timeout", 120))
    if name == "Glob":
        return tool_glob(inputs["pattern"])
    if name == "Grep":
        return tool_grep(inputs["pattern"], inputs.get("path", "."), inputs.get("include", ""))
    return f"Unknown tool: {name}"

# ── Agentic Loop ──────────────────────────────────────────────────────────────

def run_agent(prompt: str, max_turns: int = 80) -> int:
    client = get_client()
    messages = [{"role": "user", "content": prompt}]

    print(f"[agent] Starte mit Modell {MODEL}, max_turns={max_turns}", flush=True)

    for turn in range(max_turns):
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            tools=TOOLS,
            messages=messages,
        )

        # Assistent-Nachricht speichern
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            # Letzte Text-Ausgabe anzeigen
            for block in response.content:
                if hasattr(block, "text"):
                    print(block.text, flush=True)
            print(f"\n[agent] Abgeschlossen nach {turn + 1} Turn(s).", flush=True)
            return 0

        if response.stop_reason != "tool_use":
            print(f"[agent] Unerwarteter stop_reason: {response.stop_reason}", flush=True)
            return 1

        # Tool-Aufrufe ausfuehren
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            print(f"[tool] {block.name}({json.dumps(block.input)[:120]})", flush=True)
            result = execute_tool(block.name, block.input)
            result_preview = result[:200].replace("\n", "\\n")
            print(f"       → {result_preview}{'...' if len(result) > 200 else ''}", flush=True)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            })

        messages.append({"role": "user", "content": tool_results})

    print(f"[agent] Maximale Turns ({max_turns}) erreicht.", flush=True)
    return 1


if __name__ == "__main__":
    prompt_file = sys.argv[1] if len(sys.argv) > 1 else None
    max_turns = int(sys.argv[2]) if len(sys.argv) > 2 else 80

    if prompt_file:
        template = Path(prompt_file).read_text()
        # Platzhalter {VAR} mit Umgebungsvariablen befuellen (tolerant)
        try:
            prompt = template.format_map({
                k: v for k, v in os.environ.items()
                if k in (
                    "JIRA_TICKET_ID", "TICKET_CONTENT", "CONF_CONTEXT",
                    "FIX_ITERATION", "TEST_OUTPUT",
                )
            })
        except KeyError:
            prompt = template  # Unvollstaendige Vars: Template unveraendert nutzen
    else:
        prompt = sys.stdin.read()

    if not prompt.strip():
        print("Error: Kein Prompt angegeben", file=sys.stderr)
        sys.exit(1)

    sys.exit(run_agent(prompt, max_turns))
