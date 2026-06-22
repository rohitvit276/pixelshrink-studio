import asyncio
import base64
import hashlib
import logging
import os
import time
import urllib.parse
from collections import defaultdict
from typing import Literal, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Provider base URLs
HF_API_BASE = "https://api-inference.huggingface.co/models"
POLLINATIONS_API_BASE = "https://image.pollinations.ai/prompt"
TOGETHER_API_BASE = "https://api.together.xyz/v1/images/generations"

# Configuration
DEFAULT_MODEL = os.environ.get("HUGGING_FACE_MODEL", "stabilityai/stable-diffusion-2-1")
TOGETHER_MODEL = os.environ.get("TOGETHER_MODEL", "black-forest-labs/FLUX.1-schnell-Free")
RATE_LIMIT = int(os.environ.get("AI_IMAGE_RATE_LIMIT", 5))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("AI_IMAGE_RATE_LIMIT_WINDOW_SECONDS", 60))
CACHE_TTL_SECONDS = int(os.environ.get("AI_IMAGE_CACHE_TTL_SECONDS", 600))
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("AI_IMAGE_REQUEST_TIMEOUT_SECONDS", 60))
POLLINATIONS_ENABLED = os.environ.get("POLLINATIONS_ENABLED", "true").lower() != "false"

image_generation_router = APIRouter(prefix="/api", tags=["image-generation"])
request_log = defaultdict(list)
generation_cache = {}

MAX_SEED_VALUE = 2147483647  # max signed 32-bit integer
TOGETHER_MAX_STEPS = 4  # FLUX.1-schnell works best with 1–4 steps

# Error taxonomy codes
ERR_AUTH_MISSING = "auth_missing"
ERR_RATE_LIMIT = "rate_limit"
ERR_PROVIDER_LOADING = "provider_loading"
ERR_INVALID_RESPONSE = "invalid_response"
ERR_TIMEOUT = "timeout"
ERR_UNKNOWN = "unknown"


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=500)
    style: str = Field(default="Realistic", max_length=60)
    width: Literal[512, 768, 1024] = 512
    height: Literal[512, 768, 1024] = 512
    guidance_scale: float = Field(default=8.5, ge=7, le=20)
    num_inference_steps: int = Field(default=30, ge=20, le=50)
    seed: Optional[int] = Field(default=None, ge=0, le=MAX_SEED_VALUE)
    model: str = Field(default=DEFAULT_MODEL, min_length=3, max_length=120)


def _clean_expired_records(ip_address: str, now: float) -> None:
    request_log[ip_address] = [
        ts for ts in request_log[ip_address] if now - ts < RATE_LIMIT_WINDOW_SECONDS
    ]


def _clean_expired_cache(now: float) -> None:
    expired_keys = [
        key for key, value in generation_cache.items() if now - value["timestamp"] >= CACHE_TTL_SECONDS
    ]
    for key in expired_keys:
        generation_cache.pop(key, None)


def _build_cache_key(payload: ImageGenerationRequest) -> str:
    raw_key = (
        f"{payload.prompt}|{payload.style}|{payload.width}x{payload.height}|"
        f"{payload.guidance_scale}|{payload.num_inference_steps}|{payload.seed}|{payload.model}"
    )
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def _append_style_to_prompt(prompt: str, style: str) -> str:
    return f"{prompt}. Style: {style.lower()}"


def _make_error(code: str, message: str, provider: str = "") -> dict:
    """Build a structured error detail dict for HTTPException."""
    detail: dict = {"code": code, "message": message}
    if provider:
        detail["provider"] = provider
    return detail


async def _request_image_hf(model: str, token: str, payload: dict, timeout_at: float) -> Tuple[bytes, str]:
    """Request an image from Hugging Face with retries for model-loading (503) responses.

    Returns (image_bytes, mime_type). Raises HTTPException on unrecoverable errors.
    """
    headers = {"Authorization": "Bearer " + token}
    endpoint = f"{HF_API_BASE}/{model}"

    while time.time() < timeout_at:
        remaining = max(2, int(timeout_at - time.time()))
        try:
            response = await asyncio.to_thread(
                requests.post,
                endpoint,
                headers=headers,
                json=payload,
                timeout=remaining,
            )
        except requests.exceptions.Timeout:
            break
        except requests.exceptions.RequestException as exc:
            raise HTTPException(
                status_code=502,
                detail=_make_error(ERR_UNKNOWN, f"Network error reaching Hugging Face: {exc}", "huggingface"),
            )

        if response.status_code == 200:
            # HF occasionally returns 200 with a JSON error body instead of image bytes
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                error_text = ""
                try:
                    err_json = response.json()
                    error_text = err_json.get("error", str(err_json))
                except ValueError:
                    error_text = response.text[:200]
                raise HTTPException(
                    status_code=502,
                    detail=_make_error(ERR_INVALID_RESPONSE, f"Hugging Face returned an error: {error_text}", "huggingface"),
                )
            mime = content_type.split(";")[0].strip() or "image/png"
            return response.content, mime

        if response.status_code == 503:
            details: dict = {}
            try:
                details = response.json()
            except ValueError:
                pass
            wait_time = int(details.get("estimated_time", 2))
            logger.warning("HF model loading (503), waiting %ds...", min(wait_time, 8))
            await asyncio.sleep(max(1, min(wait_time, 8)))
            continue

        if response.status_code in (401, 403):
            raise HTTPException(
                status_code=500,
                detail=_make_error(ERR_AUTH_MISSING, "Hugging Face API key is invalid or lacks permission for this model.", "huggingface"),
            )

        if response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail=_make_error(ERR_RATE_LIMIT, "Hugging Face rate limit reached. Please wait a moment.", "huggingface"),
            )

        message = f"Hugging Face returned HTTP {response.status_code}."
        try:
            err_json = response.json()
            message = err_json.get("error", message)
        except ValueError:
            if response.text:
                message = response.text[:200]
        raise HTTPException(
            status_code=502,
            detail=_make_error(ERR_UNKNOWN, message, "huggingface"),
        )

    raise HTTPException(
        status_code=504,
        detail=_make_error(ERR_TIMEOUT, "Hugging Face timed out. Trying fallback provider.", "huggingface"),
    )


async def _request_image_pollinations(
    prompt: str, width: int, height: int, seed: Optional[int], timeout_at: float
) -> Tuple[bytes, str]:
    """Request an image from Pollinations.ai (free, no API key required).

    Returns (image_bytes, mime_type).
    """
    encoded_prompt = urllib.parse.quote(prompt)
    seed_val = seed if seed is not None else int(time.time()) % MAX_SEED_VALUE
    url = (
        f"{POLLINATIONS_API_BASE}/{encoded_prompt}"
        f"?width={width}&height={height}&seed={seed_val}&nologo=true&enhance=false"
    )
    remaining = max(5, int(timeout_at - time.time()))
    try:
        response = await asyncio.to_thread(requests.get, url, timeout=remaining)
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail=_make_error(ERR_TIMEOUT, "Image generation timed out. Please try again.", "pollinations"),
        )
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=_make_error(ERR_UNKNOWN, f"Network error reaching Pollinations: {exc}", "pollinations"),
        )

    if response.status_code == 200:
        content_type = response.headers.get("Content-Type", "image/jpeg")
        if "image" in content_type:
            mime = content_type.split(";")[0].strip()
            return response.content, mime
        raise HTTPException(
            status_code=502,
            detail=_make_error(ERR_INVALID_RESPONSE, "Pollinations returned unexpected content type.", "pollinations"),
        )

    raise HTTPException(
        status_code=502,
        detail=_make_error(ERR_UNKNOWN, f"Pollinations returned HTTP {response.status_code}.", "pollinations"),
    )


async def _request_image_together(
    prompt: str,
    width: int,
    height: int,
    steps: int,
    seed: Optional[int],
    token: str,
    timeout_at: float,
) -> Tuple[bytes, str]:
    """Request an image from Together AI (requires TOGETHER_API_KEY).

    Returns (image_bytes, mime_type).
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # FLUX.1-schnell works best with 1–4 steps; clamp regardless of user setting
    together_steps = min(steps, TOGETHER_MAX_STEPS)
    payload: dict = {
        "model": TOGETHER_MODEL,
        "prompt": prompt,
        "width": width,
        "height": height,
        "steps": together_steps,
        "n": 1,
        "response_format": "b64_json",
    }
    if seed is not None:
        payload["seed"] = seed

    remaining = max(5, int(timeout_at - time.time()))
    try:
        response = await asyncio.to_thread(
            requests.post, TOGETHER_API_BASE, headers=headers, json=payload, timeout=remaining
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail=_make_error(ERR_TIMEOUT, "Together AI timed out.", "together"),
        )
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=_make_error(ERR_UNKNOWN, f"Network error reaching Together AI: {exc}", "together"),
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=500,
            detail=_make_error(ERR_AUTH_MISSING, "Together AI API key is invalid or lacks permission.", "together"),
        )
    if response.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail=_make_error(ERR_RATE_LIMIT, "Together AI rate limit reached. Please wait.", "together"),
        )
    if response.status_code != 200:
        message = f"Together AI returned HTTP {response.status_code}."
        try:
            err_json = response.json()
            err_obj = err_json.get("error", {})
            message = err_obj.get("message", message) if isinstance(err_obj, dict) else str(err_obj)
        except ValueError:
            pass
        raise HTTPException(status_code=502, detail=_make_error(ERR_UNKNOWN, message, "together"))

    try:
        result = response.json()
        b64 = result["data"][0]["b64_json"]
        return base64.b64decode(b64), "image/png"
    except (KeyError, IndexError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=_make_error(ERR_INVALID_RESPONSE, f"Together AI returned unexpected response format: {exc}", "together"),
        )


@image_generation_router.post("/generate-image")
async def generate_image(payload: ImageGenerationRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    _clean_expired_records(client_ip, now)
    _clean_expired_cache(now)
    if len(request_log[client_ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=_make_error(
                ERR_RATE_LIMIT,
                f"Rate limit reached: {RATE_LIMIT} images per minute. Please wait before trying again.",
            ),
        )
    request_log[client_ip].append(now)

    cache_key = _build_cache_key(payload)
    cached = generation_cache.get(cache_key)
    if cached and now - cached["timestamp"] < CACHE_TTL_SECONDS:
        return {**cached["response"], "cached": True}

    prompt_with_style = _append_style_to_prompt(payload.prompt.strip(), payload.style)
    timeout_at = time.time() + REQUEST_TIMEOUT_SECONDS

    hf_token = os.environ.get("HUGGING_FACE_API_KEY")
    together_token = os.environ.get("TOGETHER_API_KEY")

    # Guard: at least one provider must be reachable
    if not hf_token and not together_token and not POLLINATIONS_ENABLED:
        raise HTTPException(
            status_code=500,
            detail=_make_error(
                ERR_AUTH_MISSING,
                "Image generation is not configured. Set HUGGING_FACE_API_KEY or TOGETHER_API_KEY, or enable Pollinations (POLLINATIONS_ENABLED=true).",
            ),
        )

    image_bytes: Optional[bytes] = None
    mime_type = "image/png"
    used_provider = "unknown"
    last_error: Optional[HTTPException] = None

    # Primary: Hugging Face (if configured)
    if hf_token and time.time() < timeout_at:
        hf_payload = {
            "inputs": prompt_with_style,
            "parameters": {
                "width": payload.width,
                "height": payload.height,
                "guidance_scale": payload.guidance_scale,
                "num_inference_steps": payload.num_inference_steps,
            },
            "options": {"wait_for_model": True, "use_cache": True},
        }
        if payload.seed is not None:
            hf_payload["parameters"]["seed"] = payload.seed
        try:
            image_bytes, mime_type = await _request_image_hf(payload.model, hf_token, hf_payload, timeout_at)
            used_provider = "huggingface"
        except HTTPException as exc:
            last_error = exc
            logger.warning("HF provider failed (%s): %s", exc.status_code, exc.detail)

    # Fallback 1: Together AI (if configured and primary failed or not set)
    if image_bytes is None and together_token and time.time() < timeout_at:
        try:
            image_bytes, mime_type = await _request_image_together(
                prompt_with_style,
                payload.width,
                payload.height,
                payload.num_inference_steps,
                payload.seed,
                together_token,
                timeout_at,
            )
            used_provider = "together"
        except HTTPException as exc:
            last_error = exc
            logger.warning("Together provider failed (%s): %s", exc.status_code, exc.detail)

    # Fallback 2: Pollinations.ai (free, no key required — always available when enabled)
    if image_bytes is None and POLLINATIONS_ENABLED and time.time() < timeout_at:
        try:
            image_bytes, mime_type = await _request_image_pollinations(
                prompt_with_style, payload.width, payload.height, payload.seed, timeout_at
            )
            used_provider = "pollinations"
        except HTTPException as exc:
            last_error = exc
            logger.warning("Pollinations provider failed (%s): %s", exc.status_code, exc.detail)

    if image_bytes is None:
        if last_error:
            raise last_error
        raise HTTPException(
            status_code=503,
            detail=_make_error(ERR_UNKNOWN, "All image generation providers are currently unavailable. Please try again later."),
        )

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    response_body = {
        "imageBase64": image_base64,
        "mimeType": mime_type,
        "seed": payload.seed,
        "model": payload.model,
        "provider": used_provider,
        "cached": False,
    }
    generation_cache[cache_key] = {"timestamp": now, "response": response_body}
    return response_body
