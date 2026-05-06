from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid7

from ..domain.alert_rule import AlertRule
from ..domain.ports.repositories import AlertRuleRepository
from .dtos import AlertRuleDTO, CreateAlertRuleInput


class CreateAlertRuleUseCase:
    """Caso de uso: crear una regla de alerta en un workspace."""

    VALID_METRICS = {"THRESHOLD", "SENSOR_OFFLINE", "BATTERY_LOW"}
    VALID_OPERATORS = {"GT", "LT", "GTE", "LTE"}

    def __init__(self, repo: AlertRuleRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: CreateAlertRuleInput) -> AlertRuleDTO:
        """
        Valida los campos de la regla y la persiste.
        Para metric=THRESHOLD, operator y threshold son obligatorios.
        """
        if cmd.metric not in self.VALID_METRICS:
            raise ValueError(f"Metric invalido: {cmd.metric!r}")

        if cmd.metric == "THRESHOLD":
            if cmd.operator not in self.VALID_OPERATORS:
                raise ValueError(f"Operator invalido para THRESHOLD: {cmd.operator!r}")
            if cmd.threshold is None:
                raise ValueError("threshold es obligatorio para metric=THRESHOLD")

        now = datetime.now(UTC)
        rule = AlertRule(
            id=uuid7(),
            workspace_id=UUID(cmd.workspace_id),
            unit_id=UUID(cmd.unit_id) if cmd.unit_id else None,
            name=cmd.name,
            metric=cmd.metric,
            operator=cmd.operator,
            threshold=cmd.threshold,
            is_active=True,
            created_by=UUID(cmd.created_by),
            created_at=now,
            updated_at=now,
        )
        await self._repo.save(rule)
        return self._to_dto(rule)

    def _to_dto(self, rule: AlertRule) -> AlertRuleDTO:
        """Convierte la entidad de dominio al DTO de salida."""
        return AlertRuleDTO(
            rule_id=str(rule.id),
            workspace_id=str(rule.workspace_id),
            unit_id=str(rule.unit_id) if rule.unit_id else None,
            name=rule.name,
            metric=rule.metric,
            operator=rule.operator,
            threshold=rule.threshold,
            is_active=rule.is_active,
            created_by=str(rule.created_by),
            created_at=rule.created_at,
        )
