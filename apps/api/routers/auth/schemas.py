from __future__ import annotations

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """Datos requeridos para registrar un nuevo usuario."""

    email: EmailStr
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    """Credenciales para autenticacion."""

    email: EmailStr
    password: str


class RequestResetRequest(BaseModel):
    """Email del usuario que solicita el reset de contraseña."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Token de reset y nueva contraseña."""

    token: str
    new_password: str


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
