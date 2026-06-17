from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import settings


def _agent_url(path: str) -> str:
    base = settings.agent_server_url.rstrip("/")
    normalized = path if path.startswith("/") else f"/{path}"
    return f"{base}{normalized}"


def _response_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
        detail = payload.get("detail")
        if detail:
            return str(detail)
    except Exception:
        pass

    text = response.text.strip()
    return text or f"Agent server returned HTTP {response.status_code}."


async def _request(method: str, path: str, **kwargs: Any) -> Any:
    try:
        async with httpx.AsyncClient(timeout=settings.agent_server_timeout_sec) as client:
            response = await client.request(method, _agent_url(path), **kwargs)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Agent server is unreachable: {exc}") from exc

    if response.status_code >= 400:
        detail = _response_detail(response)
        status_code = response.status_code if response.status_code < 500 else 502
        raise HTTPException(status_code=status_code, detail=detail)

    if response.status_code == 204:
        return None

    try:
        return response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Agent server returned invalid JSON.") from exc


async def agent_post_json(path: str, payload: dict[str, Any]) -> Any:
    return await _request("POST", path, json=payload)


async def agent_get(path: str, params: dict[str, Any]) -> Any:
    return await _request("GET", path, params=params)


async def agent_post_multipart(path: str, data: dict[str, Any], files: dict[str, Any]) -> Any:
    return await _request("POST", path, data=data, files=files)


async def agent_patch_form(path: str, data: dict[str, Any]) -> Any:
    return await _request("PATCH", path, data=data)
