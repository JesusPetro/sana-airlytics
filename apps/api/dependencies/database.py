from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..config.settings import settings

logger = logging.getLogger(__name__)

# Motor asincrono. pool_pre_ping=True reconecta si la conexion fue cerrada por el servidor.
_engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=settings.is_development,
)

_AsyncSessionLocal = async_sessionmaker(
    bind=_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependencia FastAPI que provee una sesion asincrona de SQLAlchemy por request.
    Garantiza el cierre correcto de la sesion al finalizar la request,
    incluso si ocurre una excepcion durante el procesamiento.

    Uso en un endpoint:
        async def my_endpoint(db: AsyncSession = Depends(get_async_session)):
    """
    async with _AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
