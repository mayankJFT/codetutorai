"""Unit tests for call_llm retry/fallback logic with a stubbed OpenRouter HTTP layer."""
import pytest

import utils.call_llm as cl


class FakeResp:
    def __init__(self, status_code=200, json_data=None, text="", headers=None):
        self.status_code = status_code
        self._json = json_data
        self.text = text
        self.headers = headers or {}

    def json(self):
        if self._json is None:
            raise ValueError("no json")
        return self._json


def ok(text):
    return FakeResp(200, {"choices": [{"message": {"content": text}}]})


def err(status, message):
    # OpenRouter echoes the effective code inside the error object.
    return FakeResp(status, {"error": {"message": message, "code": status}})


@pytest.fixture
def no_sleep(monkeypatch):
    monkeypatch.setattr(cl.time, "sleep", lambda s: None)


def run(monkeypatch, script, **env):
    """script: list of callables invoked per attempt; each returns a FakeResp."""
    calls = []

    def fake_post(url, headers=None, json=None, timeout=None):
        step = script[min(len(calls), len(script) - 1)]
        calls.append(json)  # json is the request payload
        return step(json)

    monkeypatch.setattr(cl.requests, "post", fake_post)
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    out = cl.call_llm("test prompt", use_cache=False)
    return out, calls


def test_success_first_try(monkeypatch, no_sleep):
    out, calls = run(monkeypatch, [lambda kw: ok("hello")], OPENROUTER_MODEL="m1")
    assert out == "hello"
    assert calls[0]["model"] == "m1"


def test_429_retries_same_model_when_no_fallback(monkeypatch, no_sleep):
    script = [lambda kw: err(429, "rate limited: try again in 2.5s"), lambda kw: ok("ok")]
    out, calls = run(monkeypatch, script, OPENROUTER_MODEL="m1")
    assert out == "ok"
    assert len(calls) == 2
    assert calls[1]["model"] == "m1"  # no fallback configured -> back off, same model


def test_429_switches_to_fallback_model(monkeypatch, no_sleep):
    def step(kw):
        if kw["model"] == "m1":
            return err(429, "rate limit exceeded")
        return ok("from-fallback")
    out, calls = run(monkeypatch, [step, step], OPENROUTER_MODEL="m1", OPENROUTER_FALLBACK_MODEL="m2")
    assert out == "from-fallback"
    assert calls[0]["model"] == "m1"
    assert calls[1]["model"] == "m2"


def test_429_on_all_models_raises_clear_error(monkeypatch, no_sleep):
    def step(kw):
        return err(429, "rate limit exceeded")
    with pytest.raises(Exception, match="rate limit"):
        run(monkeypatch, [step] * 8, OPENROUTER_MODEL="m1", OPENROUTER_FALLBACK_MODEL="m2,m3", LLM_RATE_RETRIES="2")


def test_chain_walks_all_fallbacks(monkeypatch, no_sleep):
    def step(kw):
        if kw["model"] in ("m1", "m2"):
            return err(429, "rate limit exceeded")
        return ok("third-model")
    out, calls = run(monkeypatch, [step] * 4, OPENROUTER_MODEL="m1", OPENROUTER_FALLBACK_MODEL="m2,m3")
    assert out == "third-model"
    assert [c["model"] for c in calls] == ["m1", "m2", "m3"]


def test_413_fails_fast_with_clear_error(monkeypatch, no_sleep):
    def too_big(kw):
        return err(413, "Request too large... please reduce your message size and try again.")
    with pytest.raises(Exception, match="per-request token limit"):
        run(monkeypatch, [too_big] * 3, OPENROUTER_MODEL="m1")


def test_402_credits_exhausted_raises(monkeypatch, no_sleep):
    def broke(kw):
        return err(402, "Insufficient credits")
    with pytest.raises(Exception, match="credits"):
        run(monkeypatch, [broke] * 3, OPENROUTER_MODEL="m1")


def test_empty_completion_retries_then_fails(monkeypatch, no_sleep):
    def empty(kw):
        return ok("   ")
    with pytest.raises(Exception, match="empty completion"):
        run(monkeypatch, [empty] * 3, OPENROUTER_MODEL="m1", LLM_RATE_RETRIES="1")


def test_missing_api_key_raises(monkeypatch, no_sleep):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.setattr(cl.requests, "post", lambda *a, **k: ok("x"))
    with pytest.raises(Exception, match="OPENROUTER_API_KEY"):
        cl.call_llm("p", use_cache=False)
