import logging
import os
import re
import threading
import time
from datetime import datetime

import requests

from utils.llm_cache import create_llm_cache

# Configure logging
log_directory = os.getenv("LOG_DIR", "logs")
os.makedirs(log_directory, exist_ok=True)
log_file = os.path.join(
    log_directory, f"llm_calls_{datetime.now().strftime('%Y%m%d')}.log"
)

# Set up logger
logger = logging.getLogger("llm_logger")
logger.setLevel(logging.INFO)
logger.propagate = False  # Prevent propagation to root logger
if not logger.handlers:
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(file_handler)

_cache = create_llm_cache()

# Only one LLM request in flight per process: concurrent jobs share one
# provider rate-limit budget, so serializing calls prevents 429 storms
# where parallel jobs fail each other.
_llm_gate = threading.Lock()

OPENROUTER_URL = os.getenv(
    "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions"
)

# Providers format retry hints as "7.66s", "1m2.638s", or "2m3s".
_RETRY_AFTER_RE = re.compile(r"try again in (?:(\d+)m)?([0-9.]+)s", re.IGNORECASE)


def _env_int(name, fallback_name, default):
    """Read an int env var, honoring a legacy fallback name for compatibility."""
    raw = os.getenv(name) or os.getenv(fallback_name)
    try:
        return int(raw) if raw is not None else default
    except (TypeError, ValueError):
        return default


def _retry_delay(error_text: str, attempt: int, retry_after=None) -> float:
    # Prefer the server's explicit Retry-After header (seconds) when present.
    if retry_after is not None:
        try:
            return min(float(retry_after) + 1.0, 180.0)
        except (TypeError, ValueError):
            pass
    match = _RETRY_AFTER_RE.search(error_text or "")
    if match:
        minutes = int(match.group(1) or 0)
        seconds = float(match.group(2))
        return min(minutes * 60 + seconds + 1.0, 180.0)
    return min(20.0 * (attempt + 1), 120.0)


def call_llm(prompt: str, use_cache: bool = True, max_tokens: int = None) -> str:
    # Log the prompt
    logger.info(f"PROMPT: {prompt}")

    # Cache is keyed by requested model + prompt so a model switch never
    # serves stale answers from a different model.
    requested_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free")
    cache_key = f"[{requested_model}] {prompt}"

    if use_cache:
        try:
            cached = _cache.get(cache_key)
        except Exception as e:  # cache read must never break generation
            logger.warning(f"Cache read failed, proceeding without cache: {e}")
            cached = None
        if cached is not None:
            logger.info(f"RESPONSE (cache): {cached}")
            return cached

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY is not set")
        raise Exception("OPENROUTER_API_KEY is not set")

    max_retries = _env_int("LLM_RATE_RETRIES", "GROQ_RATE_RETRIES", 4)
    model = requested_model
    # Optional comma-separated fallback chain; a fresh model usually has its
    # own separate rate-limit budget, so it's instant relief on a 429.
    _fallbacks = [
        m.strip()
        for m in os.getenv("OPENROUTER_FALLBACK_MODEL", "").split(",")
        if m.strip()
    ]
    fallback_chain = [m for m in _fallbacks if m != model]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    # Optional OpenRouter attribution headers (used for their rankings only).
    referer = os.getenv("OPENROUTER_REFERER")
    if referer:
        headers["HTTP-Referer"] = referer
    headers["X-Title"] = os.getenv("OPENROUTER_TITLE", "CodeTutorAI")

    timeout = float(os.getenv("LLM_TIMEOUT", "120"))
    default_max_tokens = _env_int("LLM_MAX_TOKENS", "GROQ_MAX_TOKENS", 4000)
    response_text = None
    last_error = None

    # Reasoning control: "off" (default) disables hidden chain-of-thought so
    # the whole token budget goes to the answer; "low" caps it; "on" leaves
    # the provider default. Models that reject the parameter get a retry
    # without it (see below).
    reasoning_mode = os.getenv("LLM_REASONING", "off").lower()
    send_reasoning = reasoning_mode in ("off", "low")

    for attempt in range(max_retries + 1):
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": max_tokens or default_max_tokens,
            "top_p": 1,
        }
        if send_reasoning:
            payload["reasoning"] = {"enabled": False} if reasoning_mode == "off" else {"effort": "low"}
        try:
            with _llm_gate:
                resp = requests.post(
                    OPENROUTER_URL, headers=headers, json=payload, timeout=timeout
                )
        except requests.RequestException as e:
            last_error = e
            if attempt < max_retries:
                logger.warning(f"Network error (attempt {attempt + 1}): {e}")
                time.sleep(_retry_delay(str(e), attempt))
                continue
            logger.error(f"LLM API call failed: {e}")
            raise Exception(f"API call failed: {e}")

        try:
            data = resp.json()
        except ValueError:
            data = {}
        err = data.get("error") if isinstance(data, dict) else None
        # OpenRouter can return an error object (with the real HTTP-ish code)
        # even under a 200, so let the error's own code win when present.
        status = resp.status_code
        if isinstance(err, dict) and err.get("code") is not None:
            try:
                status = int(err["code"])
            except (TypeError, ValueError):
                pass

        if status == 400 and send_reasoning and "reasoning" in str(err).lower():
            logger.warning(f"Model {model} rejected the reasoning parameter; retrying without it")
            send_reasoning = False
            continue

        # Success path.
        if resp.status_code == 200 and not err and data.get("choices"):
            response_text = (data["choices"][0].get("message", {}).get("content") or "")
            if response_text.strip():
                break
            # Empty completion (e.g. the model burned the budget on nothing).
            last_error = RuntimeError("empty completion")
            if attempt < max_retries:
                logger.warning(f"Empty completion (attempt {attempt + 1}); retrying")
                time.sleep(min(5.0 * (attempt + 1), 30.0))
                continue
            raise Exception("API call failed: empty completion")

        # Error path.
        message = ""
        if isinstance(err, dict):
            message = err.get("message") or ""
        message = message or resp.text or f"HTTP {resp.status_code}"
        last_error = Exception(message)
        lower = message.lower()

        too_large = status in (400, 413) and any(
            t in lower
            for t in ("token", "context", "too large", "maximum", "length", "reduce your message")
        )
        if too_large:
            logger.error(f"LLM request too large: {message}")
            raise Exception(
                "The prompt exceeds the model's per-request token limit. This usually means "
                "the repository is large - lower PROMPT_CONTEXT_MAX_CHARS, tighten the include "
                f"patterns, or use a model with a larger context. Provider message: {message}"
            )
        if status == 402:
            logger.error(f"OpenRouter credits exhausted: {message}")
            raise Exception(
                "OpenRouter reports insufficient credits or a free-tier limit was reached. "
                "Add credits, wait for the free-tier window to reset, or switch models. "
                f"Provider message: {message}"
            )
        if status == 429 and attempt < max_retries:
            if fallback_chain:
                next_model = fallback_chain.pop(0)
                logger.warning(f"{model} rate limited; switching to {next_model}")
                model = next_model
                continue
            delay = _retry_delay(message, attempt, resp.headers.get("Retry-After"))
            logger.warning(f"Rate limited (attempt {attempt + 1}); sleeping {delay:.1f}s")
            time.sleep(delay)
            continue
        if status == 429:
            logger.error(f"Rate limit / budget exhausted: {message}")
            raise Exception(
                "The model's rate limit or daily budget is exhausted. It resets over time - "
                "try again later, add an OPENROUTER_FALLBACK_MODEL, or upgrade the tier. "
                f"Provider message: {message}"
            )
        logger.error(f"LLM API call failed: {message}")
        raise Exception(f"API call failed: {message}")

    if response_text is None:
        raise Exception(f"API call failed: {last_error}")

    # Log the response
    logger.info(f"RESPONSE: {response_text}")

    if use_cache:
        try:
            _cache.set(cache_key, response_text)
        except Exception as e:  # cache failures must never break generation
            logger.error(f"Failed to save cache: {e}")

    return response_text


if __name__ == "__main__":
    test_prompt = "Hello, how are you?"
    print("Making call...")
    response = call_llm(test_prompt, use_cache=False)
    print(f"Response: {response}")
