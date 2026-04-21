from __future__ import annotations

from uuid import uuid7

import pytest

from access_control.domain.user import User


def test_create_hashea_contrasena():
    """User.create debe hashear la contrasena — no almacenar texto plano."""
    user = User.create(uuid7(), "a@b.com", "secreto123", "Juan", "Perez")
    assert user.password_hash != "secreto123"
    assert user.password_hash.startswith("$2b$")


def test_verify_password_correcto():
    """verify_password debe retornar True con la contrasena correcta."""
    user = User.create(uuid7(), "a@b.com", "secreto123", "Juan", "Perez")
    assert user.verify_password("secreto123") is True


def test_verify_password_incorrecto():
    """verify_password debe retornar False con contrasena incorrecta."""
    user = User.create(uuid7(), "a@b.com", "secreto123", "Juan", "Perez")
    assert user.verify_password("otra") is False


def test_email_invalido_lanza_error():
    """Un email sin @ debe lanzar ValueError en el constructor."""
    with pytest.raises(ValueError):
        User(uuid7(), "no-es-email", "hash", "Juan", "Perez")


def test_email_normalizado_a_lowercase():
    """El email se normaliza a minusculas al construir el usuario."""
    user = User.create(uuid7(), "UPPER@CASE.COM", "pass", "Juan", "Perez")
    assert user.email == "upper@case.com"


def test_deactivate_cambia_estado():
    """deactivate debe poner is_active=False y registrar deleted_at."""
    user = User.create(uuid7(), "a@b.com", "pass", "Juan", "Perez")
    assert user.is_active is True
    user.deactivate()
    assert user.is_active is False
    assert user.deleted_at is not None


def test_type_es_none_por_defecto():
    """El campo type debe ser None si no se especifica."""
    user = User.create(uuid7(), "a@b.com", "pass", "Juan", "Perez")
    assert user.type is None
