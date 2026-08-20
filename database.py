"""
Minimal SQLite-backed document store exposing the subset of the pymongo
Collection API used by backend.py (find_one / find / insert_one /
update_one / delete_one with $set, $push, $in, $gte, $gt, $lte, $lt).

Each collection is a table ``(id TEXT PRIMARY KEY, doc TEXT)`` where ``doc``
is the JSON-encoded document. Datetimes are stored as ISO-8601 strings tagged
so they round-trip back into ``datetime`` objects.
"""

import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

_DT_TAG = "$datetime"


def _encode(obj: Any) -> Any:
    if isinstance(obj, datetime):
        return {_DT_TAG: obj.isoformat()}
    if isinstance(obj, dict):
        return {k: _encode(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_encode(v) for v in obj]
    return obj


def _decode(obj: Any) -> Any:
    if isinstance(obj, dict):
        if len(obj) == 1 and _DT_TAG in obj:
            return datetime.fromisoformat(obj[_DT_TAG])
        return {k: _decode(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decode(v) for v in obj]
    return obj


_OPERATORS = {
    "$in": lambda value, arg: value in arg,
    "$gte": lambda value, arg: value is not None and value >= arg,
    "$gt": lambda value, arg: value is not None and value > arg,
    "$lte": lambda value, arg: value is not None and value <= arg,
    "$lt": lambda value, arg: value is not None and value < arg,
    "$ne": lambda value, arg: value != arg,
}


def _matches(doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        value = doc.get(key)
        if isinstance(expected, dict) and expected and all(k.startswith("$") for k in expected):
            for op, arg in expected.items():
                fn = _OPERATORS.get(op)
                if fn is None:
                    raise ValueError(f"Unsupported query operator: {op}")
                if not fn(value, arg):
                    return False
        elif value != expected:
            return False
    return True


class Cursor(list):
    """List of documents supporting pymongo-style ``.sort()`` / ``.limit()`` chaining."""

    def sort(self, key: str, direction: int = 1) -> "Cursor":
        present = [d for d in self if d.get(key) is not None]
        missing = [d for d in self if d.get(key) is None]
        present.sort(key=lambda d: d[key], reverse=(direction < 0))
        # Mongo orders missing/null values first ascending, last descending.
        ordered = (missing + present) if direction >= 0 else (present + missing)
        return Cursor(ordered)

    def limit(self, n: int) -> "Cursor":
        return Cursor(self[:n]) if n > 0 else Cursor(self)


class InsertResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int):
        self.matched_count = matched_count
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class Collection:
    def __init__(self, store: "SQLiteStore", name: str):
        self._store = store
        self.name = name
        with store._lock:
            store._conn.execute(
                f'CREATE TABLE IF NOT EXISTS "{name}" (id TEXT PRIMARY KEY, doc TEXT NOT NULL)'
            )
            store._conn.commit()

    # -- internal helpers -------------------------------------------------
    def _rows(self) -> Iterable[Dict[str, Any]]:
        cur = self._store._conn.execute(f'SELECT doc FROM "{self.name}"')
        return (_decode(json.loads(row[0])) for row in cur.fetchall())

    def _scan(self, query: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Fast path: exact lookup by primary key.
        if query and isinstance(query.get("_id"), str):
            cur = self._store._conn.execute(
                f'SELECT doc FROM "{self.name}" WHERE id = ?', (query["_id"],)
            )
            row = cur.fetchone()
            if row is None:
                return []
            doc = _decode(json.loads(row[0]))
            return [doc] if _matches(doc, query) else []
        return [doc for doc in self._rows() if _matches(doc, query)]

    def _write(self, doc: Dict[str, Any]) -> None:
        self._store._conn.execute(
            f'UPDATE "{self.name}" SET doc = ? WHERE id = ?',
            (json.dumps(_encode(doc)), doc["_id"]),
        )

    # -- public API -------------------------------------------------------
    def find_one(self, query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        with self._store._lock:
            found = self._scan(query)
        return found[0] if found else None

    def find(self, query: Optional[Dict[str, Any]] = None) -> Cursor:
        with self._store._lock:
            return Cursor(self._scan(query))

    def insert_one(self, doc: Dict[str, Any]) -> InsertResult:
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        with self._store._lock:
            self._store._conn.execute(
                f'INSERT INTO "{self.name}" (id, doc) VALUES (?, ?)',
                (doc["_id"], json.dumps(_encode(doc))),
            )
            self._store._conn.commit()
        return InsertResult(doc["_id"])

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> UpdateResult:
        with self._store._lock:
            found = self._scan(query)
            if not found:
                return UpdateResult(0, 0)
            doc = found[0]
            for op, fields in update.items():
                if op == "$set":
                    doc.update(fields)
                elif op == "$push":
                    for key, value in fields.items():
                        doc.setdefault(key, []).append(value)
                else:
                    raise ValueError(f"Unsupported update operator: {op}")
            self._write(doc)
            self._store._conn.commit()
            return UpdateResult(1, 1)

    def delete_one(self, query: Dict[str, Any]) -> DeleteResult:
        with self._store._lock:
            found = self._scan(query)
            if not found:
                return DeleteResult(0)
            self._store._conn.execute(
                f'DELETE FROM "{self.name}" WHERE id = ?', (found[0]["_id"],)
            )
            self._store._conn.commit()
            return DeleteResult(1)


class SQLiteStore:
    """Document store over a single SQLite file. Thread-safe via a lock."""

    def __init__(self, path: str):
        self.path = path
        directory = os.path.dirname(os.path.abspath(path))
        os.makedirs(directory, exist_ok=True)
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._lock = threading.RLock()
        self._collections: Dict[str, Collection] = {}

    def __getitem__(self, name: str) -> Collection:
        if name not in self._collections:
            self._collections[name] = Collection(self, name)
        return self._collections[name]

    def __getattr__(self, name: str) -> Collection:
        if name.startswith("_"):
            raise AttributeError(name)
        return self[name]
