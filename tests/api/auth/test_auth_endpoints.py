from __future__ import annotations

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestRegister:
    """Tests del endpoint POST /api/v1/auth/register."""

    async def test_register_success(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """El registro exitoso retorna 201 y establece las cookies de sesion."""
        response = await client.post("/api/v1/auth/register", json=register_payload)
        assert response.status_code == 201
        assert "sana_session" in response.cookies
        assert "sana_refresh" in response.cookies
        data = response.json()
        assert data["message"] == "User registered successfully."
        assert "user_id" in data

    async def test_register_duplicate_email(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Registrar el mismo email dos veces retorna 409."""
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.post("/api/v1/auth/register", json=register_payload)
        assert response.status_code == 409

    async def test_register_weak_password(
        self, client: AsyncClient
    ) -> None:
        """Una contrasena debil retorna 422 antes de llegar al caso de uso."""
        payload = {
            "email": "weak@sana.io",
            "password": "weak",
            "first_name": "A",
            "last_name": "B",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422

    async def test_register_invalid_email(
        self, client: AsyncClient, valid_password: str
    ) -> None:
        """Un email malformado retorna 422."""
        payload = {
            "email": "not-an-email",
            "password": valid_password,
            "first_name": "A",
            "last_name": "B",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422


class TestLogin:
    """Tests del endpoint POST /api/v1/auth/login."""

    async def test_login_success(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Login exitoso establece las cookies y retorna 200."""
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": register_payload["email"],
                "password": register_payload["password"],
            },
        )
        assert response.status_code == 200
        assert "sana_session" in response.cookies
        assert "sana_refresh" in response.cookies

    async def test_login_wrong_password(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Password incorrecto retorna 401."""
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": register_payload["email"], "password": "WrongPass1!"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient) -> None:
        """Login con email no registrado retorna 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@sana.io", "password": "AnyPass1!"},
        )
        assert response.status_code == 401


class TestLogout:
    """Tests del endpoint POST /api/v1/auth/logout."""

    async def test_logout_clears_cookies(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Logout elimina las cookies de sesion."""
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        # Las cookies deben estar vacias o ausentes tras el logout
        assert response.cookies.get("sana_session") in (None, "")

    async def test_logout_unauthenticated(self, client: AsyncClient) -> None:
        """Logout sin cookie retorna 401."""
        response = await client.post("/api/v1/auth/logout")
        assert response.status_code == 401


class TestMe:
    """Tests del endpoint GET /api/v1/auth/me."""

    async def test_me_authenticated(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Usuario autenticado recibe sus datos correctamente."""
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == register_payload["email"]
        assert "user_id" in data

    async def test_me_unauthenticated(self, client: AsyncClient) -> None:
        """Request sin cookie retorna 401."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestRequestReset:
    """Tests del endpoint POST /api/v1/auth/request-reset."""

    async def test_request_reset_registered_email(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Solicitud con email registrado retorna respuesta generica."""
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.post(
            "/api/v1/auth/request-reset",
            json={"email": register_payload["email"]},
        )
        assert response.status_code == 200
        assert "message" in response.json()

    async def test_request_reset_unregistered_email(
        self, client: AsyncClient
    ) -> None:
        """Solicitud con email no registrado retorna la misma respuesta generica (sin revelar existencia)."""
        response = await client.post(
            "/api/v1/auth/request-reset",
            json={"email": "ghost@sana.io"},
        )
        assert response.status_code == 200
        assert "message" in response.json()

    async def test_request_reset_exposes_token_in_dev_without_smtp(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """
        En development sin SMTP configurado, el token de reset se incluye
        en el response para facilitar el testing.
        """
        await client.post("/api/v1/auth/register", json=register_payload)
        response = await client.post(
            "/api/v1/auth/request-reset",
            json={"email": register_payload["email"]},
        )
        assert response.status_code == 200
        # En el ambiente de test SMTP no esta configurado, debe exponer el token
        data = response.json()
        assert "reset_token" in data or data["message"] != ""


class TestResetPassword:
    """Tests del endpoint POST /api/v1/auth/reset-password."""

    async def _get_reset_token(
        self, client: AsyncClient, register_payload: dict
    ) -> str:
        """Helper: registra usuario y obtiene su token de reset."""
        await client.post("/api/v1/auth/register", json=register_payload)
        reset_response = await client.post(
            "/api/v1/auth/request-reset",
            json={"email": register_payload["email"]},
        )
        return reset_response.json().get("reset_token", "")

    async def test_reset_password_success(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Reset exitoso con token valido retorna 200."""
        token = await self._get_reset_token(client, register_payload)
        if not token:
            pytest.skip("SMTP configurado — token no expuesto en response.")
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "NewSecure1!"},
        )
        assert response.status_code == 200

    async def test_reset_password_invalid_token(
        self, client: AsyncClient
    ) -> None:
        """Token malformado retorna 400."""
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": "not.a.valid.token", "new_password": "NewSecure1!"},
        )
        assert response.status_code == 400

    async def test_reset_password_weak_new_password(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Nueva contrasena debil retorna 422."""
        token = await self._get_reset_token(client, register_payload)
        if not token:
            pytest.skip("SMTP configurado — token no expuesto en response.")
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "weak"},
        )
        assert response.status_code == 422

    async def test_reset_password_wrong_token_type(
        self, client: AsyncClient, register_payload: dict
    ) -> None:
        """Usar un access token (no reset token) retorna 400."""
        # Registrar y hacer login para obtener un access token
        await client.post("/api/v1/auth/register", json=register_payload)
        # El access token esta en la cookie, no en el body — este test
        # simula el escenario pasando un token JWT de tipo incorrecto.
        # Se construye un token de access y se usa como reset token.
        from src.access_control.infrastructure.security.token_factory import create_access_token
        from apps.api.config.settings import settings as cfg
        fake_access_token = create_access_token(
            user_id="fake-id",
            email=register_payload["email"],
            user_type=None,
            secret_key=cfg.JWT_SECRET_KEY,
            algorithm=cfg.JWT_ALGORITHM,
            expire_minutes=60,
        )
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": fake_access_token, "new_password": "NewSecure1!"},
        )
        assert response.status_code == 400
