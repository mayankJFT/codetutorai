import logging
import os
import re
import threading
import time
from datetime import datetime

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

# Only one Groq request in flight per process: concurrent jobs share one
# tokens-per-minute budget, so serializing calls prevents 429/413 storms
# where parallel jobs fail each other.
_groq_gate = threading.Lock()

# Groq formats retry hints as "7.66s", "1m2.638s", or "2m3s".
_RETRY_AFTER_RE = re.compile(r"try again in (?:(\d+)m)?([0-9.]+)s", re.IGNORECASE)


def _retry_delay(error_text: str, attempt: int) -> float:
    match = _RETRY_AFTER_RE.search(error_text)
    if match:
        minutes = int(match.group(1) or 0)
        seconds = float(match.group(2))
        return min(minutes * 60 + seconds + 1.0, 180.0)
    return min(20.0 * (attempt + 1), 120.0)


def call_llm(prompt: str, use_cache: bool = True, max_tokens: int = None) -> str:
    # Log the prompt
    logger.info(f"PROMPT: {prompt}")

    if use_cache:
        cached = _cache.get(prompt)
        if cached is not None:
            logger.info(f"RESPONSE (cache): {cached}")
            return cached

    try:
        from groq import Groq
    except ImportError:
        logger.error("Groq library not installed. Install with: pip install groq")
        raise Exception("Groq library not available")

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    max_retries = int(os.getenv("GROQ_RATE_RETRIES", "4"))
    model = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    # The free tier's daily token budget is per model, so a sibling model is
    # instant relief when the primary's daily quota runs dry.
    fallback_model = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
    response_text = None
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            kwargs = dict(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_completion_tokens=max_tokens or int(os.getenv("GROQ_MAX_TOKENS", "4000")),
                top_p=1,
            )
            # gpt-oss are reasoning models: cap hidden reasoning so small
            # completion budgets yield actual text (and burn fewer tokens).
            if "gpt-oss" in model:
                kwargs["reasoning_effort"] = os.getenv("GROQ_REASONING_EFFORT", "low")
            with _groq_gate:
                completion = client.chat.completions.create(**kwargs)
            response_text = completion.choices[0].message.content
            if not (response_text or "").strip():
                raise RuntimeError("empty completion (reasoning consumed the token budget)")
            break
        except Exception as e:  # noqa: BLE001 - normalize provider errors below
            last_error = e
            status = getattr(e, "status_code", None)
            message = str(e)
            if status == 429 and attempt < max_retries:
                daily_exhausted = "per day" in message or "TPD" in message
                if daily_exhausted and fallback_model and model != fallback_model:
                    logger.warning(f"Daily token budget for {model} exhausted; switching to {fallback_model}")
                    model = fallback_model
                    continue
                delay = _retry_delay(message, attempt)
                logger.warning(f"Groq rate limited (attempt {attempt + 1}); sleeping {delay:.1f}s")
                time.sleep(delay)
                continue
            if status == 429 and ("per day" in message or "TPD" in message):
                logger.error(f"Groq daily budget exhausted: {e}")
                raise Exception(
                    "Groq free-tier daily token budget is exhausted for today's models. "
                    "It refills gradually - try again later, or upgrade the Groq tier. "
                    f"Provider message: {e}"
                )
            logger.error(f"Groq API call failed: {e}")
            raise Exception(f"API call failed: {e}")

    if response_text is None:
        raise Exception(f"API call failed: {last_error}")

    # Log the response
    logger.info(f"RESPONSE: {response_text}")

    if use_cache:
        try:
            _cache.set(prompt, response_text)
        except Exception as e:  # cache failures must never break generation
            logger.error(f"Failed to save cache: {e}")

    return response_text


if __name__ == "__main__":
    test_prompt = "Hello, how are you?"
    print("Making call...")
    response = call_llm(test_prompt, use_cache=False)
    print(f"Response: {response}")
