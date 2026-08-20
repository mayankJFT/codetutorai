from datetime import datetime, timezone, timedelta
import threading

import pytest

from database import SQLiteStore


@pytest.fixture
def store(tmp_path):
    return SQLiteStore(str(tmp_path / "test.db"))


def test_insert_then_find_one_by_id(store):
    col = store["users"]
    col.insert_one({"_id": "u1", "email": "a@b.com"})
    assert col.find_one({"_id": "u1"}) == {"_id": "u1", "email": "a@b.com"}


def test_find_one_missing_returns_none(store):
    assert store["users"].find_one({"email": "nope"}) is None


def test_find_one_matches_multiple_fields(store):
    col = store["jobs"]
    col.insert_one({"_id": "j1", "user_id": "u1"})
    col.insert_one({"_id": "j2", "user_id": "u2"})
    assert col.find_one({"_id": "j1", "user_id": "u2"}) is None
    assert col.find_one({"_id": "j1", "user_id": "u1"})["_id"] == "j1"


def test_find_returns_all_matching(store):
    col = store["projects"]
    col.insert_one({"_id": "p1", "user_id": "u1"})
    col.insert_one({"_id": "p2", "user_id": "u1"})
    col.insert_one({"_id": "p3", "user_id": "u2"})
    ids = sorted(d["_id"] for d in col.find({"user_id": "u1"}))
    assert ids == ["p1", "p2"]


def test_find_with_no_filter_returns_everything(store):
    col = store["projects"]
    col.insert_one({"_id": "p1"})
    col.insert_one({"_id": "p2"})
    assert len(list(col.find())) == 2


def test_in_operator(store):
    col = store["jobs"]
    for i, s in enumerate(["pending", "processing", "completed"]):
        col.insert_one({"_id": f"j{i}", "status": s})
    got = sorted(d["status"] for d in col.find({"status": {"$in": ["pending", "processing"]}}))
    assert got == ["pending", "processing"]


def test_datetime_round_trip_and_range_operators(store):
    col = store["projects"]
    now = datetime.now(timezone.utc).replace(microsecond=0)
    col.insert_one({"_id": "old", "created_at": now - timedelta(days=10)})
    col.insert_one({"_id": "new", "created_at": now - timedelta(days=1)})
    fetched = col.find_one({"_id": "new"})
    assert isinstance(fetched["created_at"], datetime)
    assert fetched["created_at"] == now - timedelta(days=1)
    recent = list(col.find({"created_at": {"$gte": now - timedelta(days=7)}}))
    assert [d["_id"] for d in recent] == ["new"]
    older = list(col.find({"created_at": {"$gte": now - timedelta(days=14), "$lt": now - timedelta(days=7)}}))
    assert [d["_id"] for d in older] == ["old"]


def test_update_one_set(store):
    col = store["jobs"]
    col.insert_one({"_id": "j1", "status": "pending", "progress": 0})
    col.update_one({"_id": "j1"}, {"$set": {"status": "processing", "progress": 50}})
    doc = col.find_one({"_id": "j1"})
    assert doc["status"] == "processing"
    assert doc["progress"] == 50


def test_update_one_push_appends_to_list(store):
    col = store["jobs"]
    col.insert_one({"_id": "j1", "logs": []})
    col.update_one({"_id": "j1"}, {"$push": {"logs": "a"}})
    col.update_one({"_id": "j1"}, {"$set": {"status": "x"}, "$push": {"logs": "b"}})
    assert col.find_one({"_id": "j1"})["logs"] == ["a", "b"]


def test_update_one_push_creates_list_when_missing(store):
    col = store["jobs"]
    col.insert_one({"_id": "j1"})
    col.update_one({"_id": "j1"}, {"$push": {"logs": "a"}})
    assert col.find_one({"_id": "j1"})["logs"] == ["a"]


def test_update_one_no_match_is_noop(store):
    col = store["jobs"]
    col.insert_one({"_id": "j1", "status": "pending"})
    col.update_one({"_id": "nope"}, {"$set": {"status": "x"}})
    assert col.find_one({"_id": "j1"})["status"] == "pending"
    assert col.find_one({"_id": "nope"}) is None


def test_delete_one(store):
    col = store["tutorials"]
    col.insert_one({"_id": "t1", "user_id": "u1"})
    col.insert_one({"_id": "t2", "user_id": "u1"})
    col.delete_one({"_id": "t1", "user_id": "u1"})
    assert col.find_one({"_id": "t1"}) is None
    assert col.find_one({"_id": "t2"}) is not None


def test_insert_without_id_generates_one(store):
    col = store["users"]
    col.insert_one({"email": "x@y.com"})
    doc = col.find_one({"email": "x@y.com"})
    assert isinstance(doc["_id"], str) and doc["_id"]


def test_duplicate_id_raises(store):
    col = store["users"]
    col.insert_one({"_id": "u1"})
    with pytest.raises(Exception):
        col.insert_one({"_id": "u1"})


def test_persists_across_store_instances(tmp_path):
    path = str(tmp_path / "p.db")
    SQLiteStore(path)["users"].insert_one({"_id": "u1"})
    assert SQLiteStore(path)["users"].find_one({"_id": "u1"}) is not None


def test_nested_documents_round_trip(store):
    col = store["projects"]
    col.insert_one({"_id": "p1", "config": {"repo_url": "x", "include": ["*.py"]}})
    assert col.find_one({"_id": "p1"})["config"] == {"repo_url": "x", "include": ["*.py"]}


def test_usable_from_multiple_threads(store):
    col = store["jobs"]
    col.insert_one({"_id": "j1", "n": 0})

    def work(i):
        col.insert_one({"_id": f"t{i}"})
        col.update_one({"_id": "j1"}, {"$push": {"logs": i}})

    threads = [threading.Thread(target=work, args=(i,)) for i in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert len(list(col.find())) == 11
    assert len(col.find_one({"_id": "j1"})["logs"]) == 10


def test_find_sort_descending_and_limit(store):
    col = store["projects"]
    for i in range(5):
        col.insert_one({"_id": f"p{i}", "created_at": datetime(2024, 1, i + 1, tzinfo=timezone.utc)})
    ids = [d["_id"] for d in col.find({}).sort("created_at", -1).limit(3)]
    assert ids == ["p4", "p3", "p2"]
    asc = [d["_id"] for d in col.find({}).sort("created_at", 1)]
    assert asc == ["p0", "p1", "p2", "p3", "p4"]


def test_find_result_works_with_list_and_len(store):
    col = store["projects"]
    col.insert_one({"_id": "p1"})
    res = col.find({})
    assert len(list(res)) == 1
    assert len(res) == 1


def test_heavy_concurrent_read_write_mix(store):
    col = store["jobs"]
    col.insert_one({"_id": "job", "progress": 0, "logs": []})
    errors = []

    def writer(i):
        try:
            for k in range(20):
                col.update_one({"_id": "job"}, {"$set": {"progress": k}, "$push": {"logs": f"{i}-{k}"}})
                col.insert_one({"_id": f"w{i}-{k}"})
        except Exception as e:  # pragma: no cover
            errors.append(e)

    def reader():
        try:
            for _ in range(50):
                col.find_one({"_id": "job"})
                col.find({"progress": {"$gte": 0}})
        except Exception as e:  # pragma: no cover
            errors.append(e)

    threads = [threading.Thread(target=writer, args=(i,)) for i in range(4)] + [
        threading.Thread(target=reader) for _ in range(4)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert errors == []
    assert len(col.find_one({"_id": "job"})["logs"]) == 80
    assert len(list(col.find())) == 81


def test_two_store_instances_can_write_concurrently(tmp_path):
    path = str(tmp_path / "multi.db")
    a, b = SQLiteStore(path), SQLiteStore(path)
    errors = []

    def work(store, prefix):
        try:
            for i in range(25):
                store["projects"].insert_one({"_id": f"{prefix}{i}"})
        except Exception as e:  # pragma: no cover
            errors.append(e)

    threads = [threading.Thread(target=work, args=(a, "a")), threading.Thread(target=work, args=(b, "b"))]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert errors == []
    assert len(list(SQLiteStore(path)["projects"].find())) == 50
