import logging
import os
import re
import threading
import time
from datetime import datetime

from utils.llm_cache import LLMCache

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

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_cache = LLMCache(
    os.getenv("LLM_CACHE_PATH", os.path.join(_BASE_DIR, "llm_cache.db")),
    legacy_json_path=os.path.join(_BASE_DIR, "llm_cache.json"),
)

# Only one Groq request in flight per process: concurrent jobs share one
# tokens-per-minute budget, so serializing calls prevents 429/413 storms
# where parallel jobs fail each other.
_groq_gate = threading.Lock()

_RETRY_AFTER_RE = re.compile(r"try again in ([0-9.]+)s", re.IGNORECASE)


def _retry_delay(error_text: str, attempt: int) -> float:
    match = _RETRY_AFTER_RE.search(error_text)
    if match:
        return min(float(match.group(1)) + 1.0, 120.0)
    return min(15.0 * (attempt + 1), 90.0)


def call_llm(prompt: str, use_cache: bool = True) -> str:
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
    response_text = None
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            with _groq_gate:
                completion = client.chat.completions.create(
                    model=os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_completion_tokens=int(os.getenv("GROQ_MAX_TOKENS", "4000")),
                    top_p=1,
                )
            response_text = completion.choices[0].message.content
            break
        except Exception as e:  # noqa: BLE001 - normalize provider errors below
            last_error = e
            status = getattr(e, "status_code", None)
            if status == 429 and attempt < max_retries:
                delay = _retry_delay(str(e), attempt)
                logger.warning(f"Groq rate limited (attempt {attempt + 1}); sleeping {delay:.1f}s")
                time.sleep(delay)
                continue
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
