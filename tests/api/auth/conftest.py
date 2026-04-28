from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from apps.api.main import create_app
from apps.api.dependencies.database import get_async_session
from apps.api.config.settings import settings

# URL de base de datos en memoria para tests
_TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """
    Motor SQLite en memoria para los tests.
    Se crea una sola vez por sesion de tests.
    """
    engine = create_async_engine(
        _TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Crear todas las tablas necesarias
    from src.access_control.infrastructure.orm_models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture()
async def db_session(test_engine):
    """
    Sesion de base de datos para cada test.
    Usa rollback al finalizar para aislar los tests.
    """
    factory = async_sessionmaker(bind=test_engine, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession):
    """
    Cliente HTTP asincrono que usa la DB de test.
    Sobreescribe la dependencia get_async_session con la sesion de test.
    """
    app = create_app()

    async def override_db():
        yield db_session

    app.dependency_overrides[get_async_session] = override_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture()
def valid_password() -> str:
    """Contrasena valida que cumple todos los requisitos de seguridad."""
    return "SecurePass1!"


@pytest.fixture()
def register_payload(valid_password: str) -> dict:
    """Payload de registro valido listo para usar en tests."""
    return {
        "email": "test@sana.io",
        "password": valid_password,
        "first_name": "Test",
        "last_name": "User",
    }
