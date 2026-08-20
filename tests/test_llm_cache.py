import threading

from utils.llm_cache import LLMCache


def test_get_missing_returns_none(tmp_path):
    cache = LLMCache(str(tmp_path / "c.db"))
    assert cache.get("nope") is None


def test_set_then_get(tmp_path):
    cache = LLMCache(str(tmp_path / "c.db"))
    cache.set("prompt", "response")
    assert cache.get("prompt") == "response"


def test_overwrite(tmp_path):
    cache = LLMCache(str(tmp_path / "c.db"))
    cache.set("p", "one")
    cache.set("p", "two")
    assert cache.get("p") == "two"


def test_persists_across_instances(tmp_path):
    path = str(tmp_path / "c.db")
    LLMCache(path).set("p", "r")
    assert LLMCache(path).get("p") == "r"


def test_migrates_legacy_json(tmp_path):
    legacy = tmp_path / "legacy.json"
    legacy.write_text('{"old prompt": "old response"}', encoding="utf-8")
    cache = LLMCache(str(tmp_path / "c.db"), legacy_json_path=str(legacy))
    assert cache.get("old prompt") == "old response"


def test_concurrent_set_get_no_corruption(tmp_path):
    cache = LLMCache(str(tmp_path / "c.db"))
    errors = []

    def work(i):
        try:
            for k in range(30):
                cache.set(f"p{i}-{k}", f"r{i}-{k}")
                assert cache.get(f"p{i}-{k}") == f"r{i}-{k}"
        except Exception as e:  # pragma: no cover
            errors.append(e)

    threads = [threading.Thread(target=work, args=(i,)) for i in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert errors == []
    assert cache.get("p0-29") == "r0-29"
