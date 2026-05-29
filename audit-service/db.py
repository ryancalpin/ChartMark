"""SQLite connection + schema bootstrap for the append-only audit trail."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "audit.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS token_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id TEXT NOT NULL,
    token_id TEXT NOT NULL,
    type TEXT NOT NULL,
    event TEXT NOT NULL,                         -- created | live_change | override | signed
    data_source TEXT,
    fhir_resource_id TEXT,
    fhir_resource_version TEXT,
    fetched_at TEXT,
    value_at_first_render TEXT,                  -- JSON
    value_at_signing TEXT,                       -- JSON
    changed_between_draft_and_signing INTEGER NOT NULL DEFAULT 0,
    manually_overridden INTEGER NOT NULL DEFAULT 0,
    actor TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ack_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id TEXT NOT NULL,
    token_id TEXT NOT NULL,
    flag_reason TEXT NOT NULL,
    acknowledged INTEGER NOT NULL DEFAULT 1,
    actor TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_audit_note ON token_audit(note_id);
CREATE INDEX IF NOT EXISTS idx_ack_audit_note ON ack_audit(note_id);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)
