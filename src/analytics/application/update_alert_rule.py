from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from ..domain.alert_rule import AlertRule
from ..domain.ports.repositories import AlertRuleRepository
from .dtos import UpdateAlertRuleInput

VALID_OPERATORS = {"GT", "LT", "GTE", "LTE"}


class AlertRuleNotFoundError(Exception):
    """La regla de alerta indicada no existe."""


class UpdateAlertRuleUseCase:
    """Caso de uso: actualizar campos editables de una regla de alerta."""

    def __init__(self, repo: AlertRuleRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: UpdateAlertRuleInput) -> None:
        """
        Actualiza los campos presentes en el comando.
        Lanza ValueError si los campos editables violan las reglas de dominio.
        Lanza AlertRuleNotFoundError si la regla no existe.
        """
        rule = await self._repo.find_by_id(UUID(cmd.rule_id))
        if rule is None:
            raise AlertRuleNotFoundError(f"Alert rule not found: {cmd.rule_id!r}")

        if cmd.operator is not None and cmd.operator not in VALID_OPERATORS:
            raise ValueError(f"Operator invalido: {cmd.operator!r}")

        if cmd.threshold is not None and cmd.threshold <= 0:
            raise ValueError("threshold debe ser mayor que cero")

        updated = AlertRule(
            id=rule.id,
            workspace_id=rule.workspace_id,
            unit_id=rule.unit_id,
            name=cmd.name if cmd.name is not None else rule.name,
            metric=rule.metric,
            operator=cmd.operator if cmd.operator is not None else rule.operator,
            threshold=cmd.threshold if cmd.threshold is not None else rule.threshold,
            is_active=cmd.is_active if cmd.is_active is not None else rule.is_active,
            created_by=rule.created_by,
            created_at=rule.created_at,
            updated_at=datetime.now(UTC),
        )
        await self._repo.save(updated)
