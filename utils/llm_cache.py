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


class MongoLLMCache:
    """Same get/set contract as LLMCache, backed by a MongoDB collection."""

    def __init__(self, mongo_url: str, database: str = "codetutorai"):
        from pymongo import MongoClient

        self._col = MongoClient(mongo_url, serverSelectionTimeoutMS=15000)[database]["llm_cache"]

    def get(self, prompt: str):
        doc = self._col.find_one({"_id": prompt})
        return doc["response"] if doc else None

    def set(self, prompt: str, response: str) -> None:
        self._col.update_one({"_id": prompt}, {"$set": {"response": response}}, upsert=True)


def create_llm_cache():
    """Cache backed by MongoDB when MONGODB_URL is set, else local SQLite."""
    mongo_url = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI")
    if mongo_url:
        return MongoLLMCache(mongo_url, os.getenv("DATABASE_NAME", "codetutorai"))
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return LLMCache(
        os.getenv("LLM_CACHE_PATH", os.path.join(base, "llm_cache.db")),
        legacy_json_path=os.path.join(base, "llm_cache.json"),
    )
