from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.ports.repositories import AlertEventRepository
from .dtos import AlertEventDTO


class GetAlertEventsUseCase:
    """Caso de uso: listar eventos de alerta historicos de un workspace."""

    def __init__(self, repo: AlertEventRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        workspace_id: str,
        from_dt: datetime | None = None,
        to_dt: datetime | None = None,
    ) -> list[AlertEventDTO]:
        """Retorna eventos de alerta filtrados por rango temporal opcional."""
        events = await self._repo.find_by_workspace(
            workspace_id=UUID(workspace_id),
            from_dt=from_dt,
            to_dt=to_dt,
        )
        return [
            AlertEventDTO(
                event_id=str(e.id),
                alert_rule_id=str(e.alert_rule_id),
                triggered_at=e.triggered_at,
                resolved_at=e.resolved_at,
                value=e.value,
                message=e.message,
            )
            for e in events
        ]
