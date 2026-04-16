from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from .orm_models import ProcessedMessageModel


class PostgresProcessedMessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def exists(self, message_id: UUID) -> bool:
        return await self._session.get(ProcessedMessageModel, message_id) is not None

    async def mark_as_processed(self, message_id: UUID) -> None:
        self._session.add(ProcessedMessageModel(message_id=message_id))
        await self._session.flush()
