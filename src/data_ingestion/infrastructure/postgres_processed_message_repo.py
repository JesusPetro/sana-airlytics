from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.infrastructure.logger import get_logger

from .orm_models import ProcessedMessageModel

_logger = get_logger(__name__)


class PostgresProcessedMessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def exists(self, message_id: UUID) -> bool:
        return await self._session.get(ProcessedMessageModel, message_id) is not None

    async def mark_as_processed(self, message_id: UUID) -> None:
        self._session.add(ProcessedMessageModel(message_id=message_id))
        try:
            await self._session.flush()
        except IntegrityError:
            # Race condition: otro worker procesó el mismo mensaje concurrentemente.
            # El check exists() no es atómico con el insert — este caso es esperado
            # bajo QoS-1 con reentrega o múltiples réplicas del subscriber.
            await self._session.rollback()
            _logger.info(
                "duplicate_message_skipped",
                message_id=str(message_id),
            )
