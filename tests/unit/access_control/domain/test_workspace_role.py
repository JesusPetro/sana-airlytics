from __future__ import annotations

from access_control.domain.workspace_role import WorkspaceRole


def test_valores_coinciden_con_nombres_en_bd():
    """Los valores del enum deben coincidir con roles.name en BD."""
    assert WorkspaceRole.ADMIN.value == "admin"
    assert WorkspaceRole.EDITOR.value == "editor"
    assert WorkspaceRole.VIEWER.value == "viewer"


def test_construccion_desde_string():
    """Debe poder construirse desde el string almacenado en BD."""
    assert WorkspaceRole("admin") == WorkspaceRole.ADMIN
    assert WorkspaceRole("viewer") == WorkspaceRole.VIEWER
