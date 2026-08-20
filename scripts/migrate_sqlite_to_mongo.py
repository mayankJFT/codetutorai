"""One-shot migration: copy local SQLite data into MongoDB.

Usage: MONGODB_URL=... python scripts/migrate_sqlite_to_mongo.py [--include-llm-cache]
Reads SQLITE_PATH (default ./codetutorai.db) and LLM_CACHE_PATH (default ./llm_cache.db).
Existing Mongo documents with the same _id are left untouched.
"""

import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

from database import SQLiteStore

COLLECTIONS = ["users", "projects", "jobs", "tutorials"]


def main() -> None:
    mongo_url = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI")
    if not mongo_url:
        raise SystemExit("Set MONGODB_URL first")
    sqlite_path = os.getenv("SQLITE_PATH", "codetutorai.db")
    if not os.path.exists(sqlite_path):
        raise SystemExit(f"SQLite file not found: {sqlite_path}")

    store = SQLiteStore(sqlite_path)
    mongo = MongoClient(mongo_url, serverSelectionTimeoutMS=15000)[os.getenv("DATABASE_NAME", "codetutorai")]

    for name in COLLECTIONS:
        docs = list(store[name].find())
        copied = skipped = 0
        for doc in docs:
            try:
                mongo[name].insert_one(doc)
                copied += 1
            except DuplicateKeyError:
                skipped += 1
        print(f"{name}: {copied} copied, {skipped} already present")

    if "--include-llm-cache" in sys.argv:
        cache_path = os.getenv("LLM_CACHE_PATH", "llm_cache.db")
        if os.path.exists(cache_path):
            conn = sqlite3.connect(cache_path)
            rows = conn.execute("SELECT prompt, response FROM cache").fetchall()
            copied = 0
            for prompt, response in rows:
                mongo["llm_cache"].update_one({"_id": prompt}, {"$set": {"response": response}}, upsert=True)
                copied += 1
            print(f"llm_cache: {copied} entries upserted")
        else:
            print(f"llm_cache: no file at {cache_path}, skipped")


if __name__ == "__main__":
    main()
