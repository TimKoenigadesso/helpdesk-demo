import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path("/app/db/helpdesk.db")

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'open',
                type TEXT NOT NULL DEFAULT 'task',
                category TEXT NOT NULL DEFAULT 'uncategorized',
                priority TEXT NOT NULL DEFAULT 'medium',
                ai_suggestion TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
        # Migration fuer bestehende DBs
        for col, definition in [
            ("category", "TEXT NOT NULL DEFAULT 'uncategorized'"),
            ("priority", "TEXT NOT NULL DEFAULT 'medium'"),
            ("ai_suggestion", "TEXT"),
            ("type", "TEXT NOT NULL DEFAULT 'task'"),
        ]:
            try:
                conn.execute(f"ALTER TABLE tickets ADD COLUMN {col} {definition}")
            except Exception:
                pass  # Spalte existiert bereits

@contextmanager
def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
