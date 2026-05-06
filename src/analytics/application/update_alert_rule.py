from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from ..domain.alert_rule import AlertRule
from ..domain.ports.repositories import AlertRuleRepository
from .dtos import UpdateAlertRuleInput


class AlertRuleNotFoundError(Exception):
    """La regla de alerta indicada no existe."""


class UpdateAlertRuleUseCase:
    """Caso de uso: activar o desactivar una regla de alerta."""

    def __init__(self, repo: AlertRuleRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: UpdateAlertRuleInput) -> None:
        """
        Actualiza el campo is_active de la regla.
        Lanza AlertRuleNotFoundError si la regla no existe.
        """
        rule = await self._repo.find_by_id(UUID(cmd.rule_id))
        if rule is None:
            raise AlertRuleNotFoundError(f"Alert rule not found: {cmd.rule_id!r}")

        updated = AlertRule(
            id=rule.id,
            workspace_id=rule.workspace_id,
            unit_id=rule.unit_id,
            name=rule.name,
            metric=rule.metric,
            operator=rule.operator,
            threshold=rule.threshold,
            is_active=cmd.is_active,
            created_by=rule.created_by,
            created_at=rule.created_at,
            updated_at=datetime.now(UTC),
        )
        await self._repo.save(updated)
