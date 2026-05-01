from __future__ import annotations

from src.access_control.domain.ports.repositories import AuditLogger
from src.access_control.infrastructure.no_op_audit_logger import NoOpAuditLogger


def get_audit_logger() -> AuditLogger:
    return NoOpAuditLogger()
