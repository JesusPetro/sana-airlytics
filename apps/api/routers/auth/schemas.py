from __future__ import annotations

import re

from pydantic import BaseModel, EmailStr, field_validator


def _validate_password_strength(v: str) -> str:
    """
    Valida que la contrasena cumpla los requisitos minimos de seguridad.
    Requisitos: >= 8 caracteres, mayuscula, minuscula, digito, caracter especial.
    """
    if len(v) < 8:
        raise ValueError("La contrasena debe tener al menos 8 caracteres.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("La contrasena debe tener al menos una mayuscula.")
    if not re.search(r"[a-z]", v):
        raise ValueError("La contrasena debe tener al menos una minuscula.")
    if not re.search(r"\d", v):
        raise ValueError("La contrasena debe tener al menos un numero.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
        raise ValueError("La contrasena debe tener al menos un caracter especial.")
    return v


class RegisterRequest(BaseModel):
    """Datos requeridos para registrar un nuevo usuario."""

    email: EmailStr
    password: str
    first_name: str
    last_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Valida la fortaleza de la contrasena en el registro."""
        return _validate_password_strength(v)


class LoginRequest(BaseModel):
    """Credenciales para autenticacion."""

    email: EmailStr
    password: str


class RequestResetRequest(BaseModel):
    """Email del usuario que solicita el reset de contrasena."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Token de reset y nueva contrasena."""

    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Valida la fortaleza de la nueva contrasena."""
        return _validate_password_strength(v)


class LoginResponse(BaseModel):
    """
    Respuesta del login basado en cookies httponly.
    El JWT no se incluye en el body — va en la cookie.
    """

    message: str
    user_id: str
    email: str


class RegisterResponse(BaseModel):
    """Respuesta tras el registro exitoso de un usuario."""

    message: str
    user_id: str


class MeResponse(BaseModel):
    """Datos del usuario actualmente autenticado."""

    user_id: str
    email: str
    type: str | None


class TokenDevResponse(BaseModel):
    """
    Respuesta del endpoint /token (solo development).
    Retorna el JWT en el body para facilitar pruebas con Swagger.
    """

    access_token: str
    token_type: str = "bearer"
    dev_note: str = (
        "DEV ONLY -- this endpoint returns 404 in production. "
        "Use the cookie-based login flow in production."
    )
