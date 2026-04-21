from __future__ import annotations

from enum import Enum


class WorkspaceRole(Enum):
    """Roles posibles dentro de un workspace. Los valores coinciden con roles.name en BD."""

    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"
