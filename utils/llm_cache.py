"""Thread-safe, durable LLM response cache backed by SQLite.

Replaces the old whole-file ``llm_cache.json`` read/rewrite (which corrupts
under concurrent jobs). On first use an existing legacy JSON file is
imported once, then left alone.
"""

import json
import os
import sqlite3
import threading


class LLMCache:
    def __init__(self, path: str, legacy_json_path: str = None):
        self.path = os.path.abspath(path)
        directory = os.path.dirname(self.path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        self._local = threading.local()
        conn = self._connection()
        conn.execute("PRAGMA journal_mode=WAL")
        with conn:
            conn.execute("CREATE TABLE IF NOT EXISTS cache (prompt TEXT PRIMARY KEY, response TEXT NOT NULL)")
        if legacy_json_path and os.path.exists(legacy_json_path):
            self._migrate_legacy(legacy_json_path)

    def _connection(self) -> sqlite3.Connection:
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(self.path, timeout=30)
            conn.execute("PRAGMA busy_timeout=30000")
            self._local.conn = conn
        return conn

    def _migrate_legacy(self, legacy_path: str) -> None:
        try:
            with open(legacy_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError):
            return
        if not isinstance(data, dict):
            return
        conn = self._connection()
        with conn:
            conn.executemany(
                "INSERT OR IGNORE INTO cache (prompt, response) VALUES (?, ?)",
                [(k, v) for k, v in data.items() if isinstance(k, str) and isinstance(v, str)],
            )

    def get(self, prompt: str):
        row = self._connection().execute("SELECT response FROM cache WHERE prompt = ?", (prompt,)).fetchone()
        return row[0] if row else None

    def set(self, prompt: str, response: str) -> None:
        conn = self._connection()
        with conn:
            conn.execute(
                "INSERT INTO cache (prompt, response) VALUES (?, ?) "
                "ON CONFLICT(prompt) DO UPDATE SET response = excluded.response",
                (prompt, response),
            )
