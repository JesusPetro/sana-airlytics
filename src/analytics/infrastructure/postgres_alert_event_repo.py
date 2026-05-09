from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.alert_event import AlertEvent
from .orm_models import AlertEventModel, AlertRuleModel
from shared.infrastructure.logger import get_logger

logger = get_logger(__name__)


class PostgresAlertEventRepository:
    """
    Adaptador de lectura para eventos de alerta.
    Depende de las tablas alert_rules y alert_events.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, event: AlertEvent) -> None:
        """Inserta un nuevo evento de alerta en la BD."""
        model = AlertEventModel(
            id=event.id,
            alert_rule_id=event.alert_rule_id,
            triggered_at=event.triggered_at,
            value=event.value,
            message=event.message,
        )
        self._session.add(model)
        await self._session.flush()

    async def find_recent(
        self,
        alert_rule_id: UUID,
        since: datetime,
    ) -> AlertEvent | None:
        """
        Retorna el evento mas reciente de la regla desde 'since'.
        Usado por el worker para verificar el cooldown anti-spam.
        """
        stmt = (
            select(AlertEventModel)
            .where(
                AlertEventModel.alert_rule_id == alert_rule_id,
                AlertEventModel.triggered_at >= since,
            )
            .order_by(AlertEventModel.triggered_at.desc())
            .limit(1)
        )
        model = (await self._session.execute(stmt)).scalar_one_or_none()
        if model is None:
            return None
        return AlertEvent(
            id=model.id,
            alert_rule_id=model.alert_rule_id,
            triggered_at=model.triggered_at,
            resolved_at=model.resolved_at,
            value=model.value,
            message=model.message,
        )

    async def find_by_workspace(
        self,
        workspace_id: UUID,
        from_dt: datetime | None,
        to_dt: datetime | None,
    ) -> list[AlertEvent]:
        """
        Retorna eventos de alerta del workspace en el rango temporal indicado.
        Hace join con alert_rules para filtrar por workspace.
        """
        stmt = (
            select(AlertEventModel)
            .join(AlertRuleModel, AlertEventModel.alert_rule_id == AlertRuleModel.id)
            .where(AlertRuleModel.workspace_id == workspace_id)
        )
        if from_dt:
            stmt = stmt.where(AlertEventModel.triggered_at >= from_dt)
        if to_dt:
            stmt = stmt.where(AlertEventModel.triggered_at <= to_dt)
        stmt = stmt.order_by(AlertEventModel.triggered_at.desc())

        rows = (await self._session.execute(stmt)).scalars().all()
        return [
            AlertEvent(
                id=r.id,
                alert_rule_id=r.alert_rule_id,
                triggered_at=r.triggered_at,
                resolved_at=r.resolved_at,
                value=r.value,
                message=r.message,
            )
            for r in rows
        ]
