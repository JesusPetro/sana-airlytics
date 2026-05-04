from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import AlertRuleRepository
from .dtos import AlertRuleDTO


class GetAlertRulesUseCase:
    """Caso de uso: listar reglas de alerta de un workspace."""

    def __init__(self, repo: AlertRuleRepository) -> None:
        self._repo = repo

    async def execute(self, workspace_id: str) -> list[AlertRuleDTO]:
        """Retorna todas las reglas del workspace, activas e inactivas."""
        rules = await self._repo.find_by_workspace(UUID(workspace_id))
        return [
            AlertRuleDTO(
                rule_id=str(r.id),
                workspace_id=str(r.workspace_id),
                datastream_id=str(r.datastream_id) if r.datastream_id else None,
                name=r.name,
                metric=r.metric,
                operator=r.operator,
                threshold=r.threshold,
                is_active=r.is_active,
                created_by=str(r.created_by),
                created_at=r.created_at,
            )
            for r in rules
        ]
