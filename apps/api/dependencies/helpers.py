from __future__ import annotations

from fastapi import HTTPException, status


def require_allowed(result) -> None:
    """Lanza HTTP 403 si el resultado de autorización RBAC indica acceso denegado."""
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result.reason or "Forbidden.",
        )
