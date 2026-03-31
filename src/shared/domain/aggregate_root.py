from __future__ import annotations

from abc import ABC

from .domain_event import DomainEvent


class AggregateRoot(ABC):
    """
    Clase base para todos los agregados del sistema.
    Solo gestiona eventos de dominio.
    """

    def __init__(self) -> None:
        self._events: list[DomainEvent] = []

    def _record_event(self, event: DomainEvent) -> None:
        self._events.append(event)

    def pull_events(self) -> list[DomainEvent]:
        """Extrae y limpia los eventos pendientes. Llamar después de save()."""
        events, self._events = self._events, []
        return events
