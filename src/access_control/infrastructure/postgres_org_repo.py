from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .orm_models import OrganizationModel


class PostgresOrganizationRepository:
    """
    Adaptador conducido: implementa OrganizationRepository sobre PostgreSQL.
    Solo lectura en el MVP — no hay casos de uso de escritura de organizaciones.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_owner_user_id(self, org_id: UUID) -> UUID | None:
        """Retorna el owner_user_id de la organizacion o None si no existe o esta inactiva."""
        stmt = select(OrganizationModel.owner_user_id).where(
            OrganizationModel.id == org_id,
            OrganizationModel.is_active.is_(True),
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()
