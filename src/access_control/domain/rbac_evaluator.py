from __future__ import annotations

from dataclasses import dataclass


# Mapa de permisos: accion → conjunto de roles que pueden ejecutarla
_PERMISSIONS: dict[str, set[str]] = {
    "observation:read":          {"viewer", "editor", "admin"},
    "annotation:read":           {"viewer", "editor", "admin"},
    "sensor:read":               {"viewer", "editor", "admin"},
    "annotation:create":         {"editor", "admin"},
    "alert_rule:create":         {"editor", "admin"},
    "alert_rule:delete":         {"editor", "admin"},
    "sensor:register":           {"admin"},
    "sensor:delete":             {"admin"},
    "collaborator:invite":       {"admin"},
    "collaborator:remove":       {"admin"},
    "collaborator:role_change":  {"admin"},
    "workspace:delete":          {"admin"},
}


@dataclass(frozen=True)
class AuthorizationResult:
    """Resultado de la evaluacion RBAC de una accion."""

    allowed: bool
    reason: str | None = None


class RbacEvaluator:
    """
    Servicio de dominio puro: evalua permisos por rol de workspace.
    Sin dependencias de infraestructura ni de otros BCs.
    """

    def evaluate(
        self,
        action: str,
        role_name: str | None,
        is_owner: bool = False,
    ) -> AuthorizationResult:
        """
        Evalua si el rol tiene permiso para ejecutar la accion.

        El flag is_owner concede acceso implicito equivalente a admin,
        sin necesitar un registro Collaborator.
        """
        # El owner tiene acceso total sin importar el rol
        if is_owner:
            return AuthorizationResult(allowed=True)

        # Sin rol en el workspace, acceso denegado
        if role_name is None:
            return AuthorizationResult(
                allowed=False,
                reason="El usuario no tiene rol en este workspace",
            )

        # Accion no registrada en la tabla de permisos
        allowed_roles = _PERMISSIONS.get(action)
        if allowed_roles is None:
            return AuthorizationResult(
                allowed=False,
                reason=f"Accion desconocida: {action}",
            )

        if role_name in allowed_roles:
            return AuthorizationResult(allowed=True)

        return AuthorizationResult(
            allowed=False,
            reason=f"El rol '{role_name}' no puede ejecutar '{action}'",
        )
