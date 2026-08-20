"""Unit tests for call_llm retry/fallback logic with a stubbed Groq client."""
import types

import pytest

import utils.call_llm as cl


class FakeRateLimit(Exception):
    def __init__(self, message, status_code=429):
        super().__init__(message)
        self.status_code = status_code


class StubCompletion:
    def __init__(self, text):
        self.choices = [types.SimpleNamespace(message=types.SimpleNamespace(content=text))]


def make_client(script):
    """script: list of callables invoked per attempt; return text or raise."""
    calls = []

    class Completions:
        def create(self, **kwargs):
            step = script[min(len(calls), len(script) - 1)]
            calls.append(kwargs)
            result = step(kwargs)
            return StubCompletion(result)

    client = types.SimpleNamespace(chat=types.SimpleNamespace(completions=Completions()))
    return client, calls


@pytest.fixture
def no_sleep(monkeypatch):
    monkeypatch.setattr(cl.time, "sleep", lambda s: None)


def run(monkeypatch, script, **env):
    client, calls = make_client(script)
    monkeypatch.setattr(cl, "Groq", None, raising=False)
    import groq
    monkeypatch.setattr(groq, "Groq", lambda api_key=None: client)
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    out = cl.call_llm("test prompt", use_cache=False)
    return out, calls


def test_success_first_try(monkeypatch, no_sleep):
    out, calls = run(monkeypatch, [lambda kw: "hello"], GROQ_MODEL="m1")
    assert out == "hello"
    assert calls[0]["model"] == "m1"


def test_tpm_429_retries_then_succeeds(monkeypatch, no_sleep):
    def fail(kw):
        raise FakeRateLimit("tokens per minute (TPM): try again in 2.5s")
    out, calls = run(monkeypatch, [fail, lambda kw: "ok"], GROQ_MODEL="m1")
    assert out == "ok"
    assert len(calls) == 2
    assert calls[1]["model"] == "m1"  # same model for TPM waits


def test_tpd_429_switches_to_fallback_model(monkeypatch, no_sleep):
    def fail_daily(kw):
        if kw["model"] == "m1":
            raise FakeRateLimit("tokens per day (TPD): Limit 200000")
        return "from-fallback"
    out, calls = run(monkeypatch, [fail_daily, fail_daily], GROQ_MODEL="m1", GROQ_FALLBACK_MODEL="m2")
    assert out == "from-fallback"
    assert calls[0]["model"] == "m1"
    assert calls[1]["model"] == "m2"


def test_tpd_on_both_models_raises_clear_error(monkeypatch, no_sleep):
    def fail_daily(kw):
        raise FakeRateLimit("tokens per day (TPD): Limit 200000")
    with pytest.raises(Exception, match="daily token budget"):
        run(monkeypatch, [fail_daily] * 6, GROQ_MODEL="m1", GROQ_FALLBACK_MODEL="m2", GROQ_RATE_RETRIES="2")


def test_reasoning_effort_only_for_gpt_oss(monkeypatch, no_sleep):
    _, calls = run(monkeypatch, [lambda kw: "x"], GROQ_MODEL="openai/gpt-oss-120b")
    assert calls[0].get("reasoning_effort") == "low"
    _, calls2 = run(monkeypatch, [lambda kw: "x"], GROQ_MODEL="llama-something")
    assert "reasoning_effort" not in calls2[0]
