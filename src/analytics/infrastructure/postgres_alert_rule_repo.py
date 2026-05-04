from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.alert_rule import AlertRule
from .orm_models import AlertRuleModel


class PostgresAlertRuleRepository:
    """
    Adaptador de persistencia y lectura para reglas de alerta.
    Depende de la tabla alert_rules creada por migracion pendiente.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, rule: AlertRule) -> None:
        """Inserta o actualiza una regla de alerta."""
        model = AlertRuleModel(
            id=rule.id,
            workspace_id=rule.workspace_id,
            datastream_id=rule.datastream_id,
            name=rule.name,
            metric=rule.metric,
            operator=rule.operator,
            threshold=rule.threshold,
            is_active=rule.is_active,
            created_by=rule.created_by,
        )
        await self._session.merge(model)
        await self._session.flush()

    async def find_by_id(self, rule_id: UUID) -> AlertRule | None:
        """Retorna la regla por ID o None si no existe."""
        model = await self._session.get(AlertRuleModel, rule_id)
        if model is None:
            return None
        return self._to_domain(model)

    async def find_by_workspace(self, workspace_id: UUID) -> list[AlertRule]:
        """Retorna todas las reglas del workspace, activas e inactivas."""
        stmt = select(AlertRuleModel).where(
            AlertRuleModel.workspace_id == workspace_id
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [self._to_domain(r) for r in rows]

    async def delete(self, rule_id: UUID) -> None:
        """Elimina fisicamente la regla. No hay soft delete para alertas."""
        model = await self._session.get(AlertRuleModel, rule_id)
        if model is not None:
            await self._session.delete(model)
            await self._session.flush()

    def _to_domain(self, model: AlertRuleModel) -> AlertRule:
        """Convierte el modelo ORM a la entidad de dominio."""
        return AlertRule(
            id=model.id,
            workspace_id=model.workspace_id,
            datastream_id=model.datastream_id,
            name=model.name,
            metric=model.metric,
            operator=model.operator,
            threshold=model.threshold,
            is_active=model.is_active,
            created_by=model.created_by,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
