"""Minimal unit tests for the image generation route helpers."""

import sys
import os

# Make sure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Patch env so server.py mongo init is skipped during import
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "pixelshrink_test")

from routes.imageGeneration import (  # noqa: E402
    _append_style_to_prompt,
    _build_cache_key,
    _make_error,
    ERR_AUTH_MISSING,
    ERR_RATE_LIMIT,
    ERR_TIMEOUT,
    ERR_INVALID_RESPONSE,
    ERR_UNKNOWN,
    ImageGenerationRequest,
)


def test_append_style_to_prompt():
    result = _append_style_to_prompt("a cat", "Realistic")
    assert result == "a cat. Style: realistic"


def test_append_style_lowercases():
    result = _append_style_to_prompt("sunset", "Oil Painting")
    assert "oil painting" in result


def test_build_cache_key_is_deterministic():
    req1 = ImageGenerationRequest(prompt="a cat", style="Realistic", seed=42)
    req2 = ImageGenerationRequest(prompt="a cat", style="Realistic", seed=42)
    assert _build_cache_key(req1) == _build_cache_key(req2)


def test_build_cache_key_differs_on_prompt():
    req1 = ImageGenerationRequest(prompt="a cat", style="Realistic")
    req2 = ImageGenerationRequest(prompt="a dog", style="Realistic")
    assert _build_cache_key(req1) != _build_cache_key(req2)


def test_make_error_basic():
    err = _make_error(ERR_AUTH_MISSING, "No key configured.")
    assert err["code"] == ERR_AUTH_MISSING
    assert err["message"] == "No key configured."
    assert "provider" not in err


def test_make_error_with_provider():
    err = _make_error(ERR_RATE_LIMIT, "Too many requests.", provider="huggingface")
    assert err["code"] == ERR_RATE_LIMIT
    assert err["provider"] == "huggingface"


def test_error_codes_are_strings():
    for code in (ERR_AUTH_MISSING, ERR_RATE_LIMIT, ERR_TIMEOUT, ERR_INVALID_RESPONSE, ERR_UNKNOWN):
        assert isinstance(code, str)
        assert len(code) > 0


def test_image_request_defaults():
    req = ImageGenerationRequest(prompt="hello world")
    assert req.style == "Realistic"
    assert req.width == 512
    assert req.height == 512
    assert req.seed is None
