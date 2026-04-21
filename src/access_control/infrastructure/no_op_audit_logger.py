from __future__ import annotations


class NoOpAuditLogger:
    """
    Implementacion vacia del puerto AuditLogger para el MVP.
    La tabla audit_entries no existe en el esquema actual.
    Reemplazar por PostgresAuditLogger cuando se cree esa tabla.
    """

    async def log(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str | None,
        success: bool,
        ip_address: str | None,
    ) -> None:
        pass
