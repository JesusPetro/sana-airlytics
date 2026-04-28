from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuracion central de la API.
    Todas las variables sensibles se leen desde el archivo .env.
    Nunca hardcodear valores secretos en este archivo.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Base de datos ---
    # Opcion A — URL completa
    DATABASE_URL: str = ""

    # Opcion B — variables individuales
    DB_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = ""
    DB_USER: str = ""
    DB_PASSWORD: str = ""

    # --- JWT ---
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_RESET_TOKEN_EXPIRE_MINUTES: int = 15

    # --- Cookie ---
    COOKIE_NAME: str = "sana_session"
    COOKIE_REFRESH_NAME: str = "sana_refresh"
    COOKIE_MAX_AGE: int = 3600  # debe coincidir con JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # --- Ambiente ---
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "pretty"

    # --- CORS ---
    CORS_ORIGINS: str = "*"

    # --- SMTP ---
    SMTP_HOST: str = ""
    SMTP_PORT: int = 2525
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str = "noreply@sana-airlytics.io"

    # --- Frontend ---
    FRONTEND_URL: str = "http://localhost:5173"

    # --- API ---
    API_TITLE: str = "SANA Airlytics API"
    API_VERSION: str = "1.0.0"

    @property
    def database_url(self) -> str:
        """
        Retorna la URL de conexion asincrona a PostgreSQL.
        Toma DATABASE_URL si esta definida. Si no, la construye
        desde las variables DB_* individuales. Normaliza el driver
        a asyncpg en ambos casos. Falla en arranque si ninguna
        opcion produce una URL valida.
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        if self.DB_HOST and self.DB_NAME:
            return (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        raise ValueError(
            "No se pudo construir DATABASE_URL. "
            "Define DATABASE_URL o las variables DB_HOST, DB_NAME, "
            "DB_USER, DB_PASSWORD en .env."
        )

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte CORS_ORIGINS a lista. Soporta '*' y lista separada por comas."""
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def cookie_config(self) -> dict:
        """
        Configuracion centralizada de la cookie de sesion.
        secure=True solo en production para requerir HTTPS.
        """
        return {
            "key": self.COOKIE_NAME,
            "httponly": True,
            "secure": self.ENVIRONMENT == "production",
            "samesite": "lax",
            "path": "/",
            "max_age": self.COOKIE_MAX_AGE,
        }

    @property
    def refresh_cookie_config(self) -> dict:
        """
        Configuracion de la cookie de refresh.
        TTL = JWT_REFRESH_TOKEN_EXPIRE_DAYS en segundos.
        """
        return {
            "key": self.COOKIE_REFRESH_NAME,
            "httponly": True,
            "secure": self.ENVIRONMENT == "production",
            "samesite": "lax",
            "path": "/api/v1/auth/refresh",  # restringir al endpoint de refresh
            "max_age": self.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        }

    @property
    def smtp_configured(self) -> bool:
        """Retorna True si las variables SMTP minimas estan presentes."""
        return bool(self.SMTP_HOST and self.SMTP_USER and self.SMTP_PASSWORD)

    @property
    def is_development(self) -> bool:
        """Retorna True si el ambiente es development."""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """Retorna True si el ambiente es production."""
        return self.ENVIRONMENT == "production"

    @property
    def docs_url(self) -> str | None:
        """Deshabilita /docs en production."""
        return None if self.is_production else "/docs"

    @property
    def redoc_url(self) -> str | None:
        """Deshabilita /redoc en production."""
        return None if self.is_production else "/redoc"


@lru_cache()
def get_settings() -> Settings:
    """Retorna la instancia singleton de Settings. Cacheada para evitar releer .env."""
    return Settings()


settings = get_settings()
