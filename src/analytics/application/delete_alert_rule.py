from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import AlertRuleRepository
from .update_alert_rule import AlertRuleNotFoundError


class DeleteAlertRuleUseCase:
    """Caso de uso: eliminar una regla de alerta."""

    def __init__(self, repo: AlertRuleRepository) -> None:
        self._repo = repo

    async def execute(self, rule_id: str) -> None:
        """
        Elimina la regla fisicamente.
        Lanza AlertRuleNotFoundError si la regla no existe.
        """
        rule = await self._repo.find_by_id(UUID(rule_id))
        if rule is None:
            raise AlertRuleNotFoundError(f"Alert rule not found: {rule_id!r}")
        await self._repo.delete(UUID(rule_id))
