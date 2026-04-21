from __future__ import annotations

import pytest

from access_control.domain.rbac_evaluator import RbacEvaluator


@pytest.fixture
def evaluator() -> RbacEvaluator:
    return RbacEvaluator()


def test_owner_puede_cualquier_accion(evaluator):
    """El owner tiene acceso implicito a cualquier accion."""
    result = evaluator.evaluate("sensor:register", role_name=None, is_owner=True)
    assert result.allowed is True


def test_owner_puede_accion_desconocida(evaluator):
    """El owner tiene acceso incluso a acciones no registradas."""
    result = evaluator.evaluate("accion:inexistente", role_name=None, is_owner=True)
    assert result.allowed is True


def test_viewer_puede_leer_observaciones(evaluator):
    """viewer tiene permiso para observation:read."""
    result = evaluator.evaluate("observation:read", role_name="viewer")
    assert result.allowed is True


def test_viewer_no_puede_registrar_sensor(evaluator):
    """viewer no tiene permiso para sensor:register."""
    result = evaluator.evaluate("sensor:register", role_name="viewer")
    assert result.allowed is False


def test_editor_puede_crear_anotacion(evaluator):
    """editor tiene permiso para annotation:create."""
    result = evaluator.evaluate("annotation:create", role_name="editor")
    assert result.allowed is True


def test_editor_no_puede_registrar_sensor(evaluator):
    """editor no tiene permiso para sensor:register."""
    result = evaluator.evaluate("sensor:register", role_name="editor")
    assert result.allowed is False


def test_admin_puede_eliminar_workspace(evaluator):
    """admin tiene permiso para workspace:delete."""
    result = evaluator.evaluate("workspace:delete", role_name="admin")
    assert result.allowed is True


def test_sin_rol_deniega(evaluator):
    """Sin rol asignado, cualquier accion es denegada."""
    result = evaluator.evaluate("observation:read", role_name=None)
    assert result.allowed is False


def test_accion_desconocida_deniega(evaluator):
    """Una accion no registrada en la tabla de permisos debe ser denegada."""
    result = evaluator.evaluate("accion:inexistente", role_name="admin")
    assert result.allowed is False
