from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid7

from src.access_control.domain.ports.repositories import (
    CollaboratorRepository,
    UserRepository,
    WorkspaceRepository,
)
from src.shared.email.email_service import EmailService
from shared.infrastructure.logger import get_logger

from ..domain.alert_event import AlertEvent
from ..domain.alert_rule import AlertRule
from ..domain.ports.repositories import (
    AlertEventRepository,
    AlertRuleRepository,
    LatestObservationDTO,
    LatestObservationRepository,
)

logger = get_logger(__name__)

# Minutos de silencio entre eventos del mismo alert_rule_id.
# Hardcodeado porque los intervalos reflejan la naturaleza fisica
# del fenomeno, no una preferencia configurable del usuario.
_COOLDOWN_MINUTES: dict[str, int] = {
    "CO2":         60,
    "VOC_INDEX":   60,
    "NOX_INDEX":   60,
    "TEMPERATURE": 60,
    "HUMIDITY":    60,
    "PM1":        360,
    "PM2_5":      360,
    "PM4":        360,
    "PM10":       360,
    "BATTERY_PCT": 60,
}
_DEFAULT_COOLDOWN_MINUTES: int = 60

# Traduccion de codigos internos a simbolos legibles para el mensaje de alerta.
_OPERATOR_LABELS: dict[str, str] = {
    "GT":  ">",
    "LT":  "<",
    "GTE": ">=",
    "LTE": "<=",
}

# Operadores para evaluacion de threshold
_OPERATORS: dict[str, Callable[[float, float], bool]] = {
    "GT":  lambda v, t: v > t,
    "LT":  lambda v, t: v < t,
    "GTE": lambda v, t: v >= t,
    "LTE": lambda v, t: v <= t,
}


class EvaluateAlertRulesUseCase:
    """
    Caso de uso ejecutado por el worker periodico.
    Evalua todas las AlertRule activas de tipo THRESHOLD contra la
    ultima observacion de cada datastream del workspace.
    """

    def __init__(
        self,
        alert_rule_repo: AlertRuleRepository,
        alert_event_repo: AlertEventRepository,
        latest_obs_repo: LatestObservationRepository,
        collaborator_repo: CollaboratorRepository,
        workspace_repo: WorkspaceRepository,
        user_repo: UserRepository,
        email_service: EmailService,
    ) -> None:
        self._alert_rules = alert_rule_repo
        self._alert_events = alert_event_repo
        self._latest_obs = latest_obs_repo
        self._collaborators = collaborator_repo
        self._workspaces = workspace_repo
        self._users = user_repo
        self._email = email_service

    async def execute(self) -> None:
        """Carga todas las reglas activas y las evalua una a una."""
        rules = await self._alert_rules.find_active()
        for rule in rules:
            await self._evaluate_rule(rule)

    async def _evaluate_rule(self, rule: AlertRule) -> None:
        """Evalua una regla contra las observaciones mas recientes del workspace."""
        if rule.metric != "THRESHOLD":
            return
        if rule.unit_id is None:
            return
        observations = await self._latest_obs.find_latest_by_unit(
            rule.workspace_id, rule.unit_id
        )
        for obs in observations:
            await self._evaluate_observation(rule, obs)

    async def _evaluate_observation(
        self,
        rule: AlertRule,
        obs: LatestObservationDTO,
    ) -> None:
        """
        Evalua una observacion contra la regla.
        Logica de qualifier:
        - SENSOR_OUT_OF_RANGE: dispara alerta de sensor sin evaluar threshold.
        - VALID o SUSPICIOUS_VALUE: evalua threshold normalmente.
        """
        if obs.qualifier == "SENSOR_OUT_OF_RANGE":
            message = (
                f"[{obs.property_code}] {obs.sensor_name}: "
                f"valor fuera de rango del hardware ({obs.value} {obs.unit_symbol})."
            )
            await self._fire_if_not_in_cooldown(rule, obs, message)
            return

        comparator = _OPERATORS.get(rule.operator)
        if comparator is None:
            return
        if not comparator(obs.value, rule.threshold):
            return

        op_label = _OPERATOR_LABELS.get(rule.operator, rule.operator)
        message = (
            f"[{obs.property_code}] {obs.sensor_name}: "
            f"{obs.value} {obs.unit_symbol} {op_label} {rule.threshold} {obs.unit_symbol}."
        )
        await self._fire_if_not_in_cooldown(rule, obs, message)

    async def _fire_if_not_in_cooldown(
        self,
        rule: AlertRule,
        obs: LatestObservationDTO,
        message: str,
    ) -> None:
        """Verifica cooldown y dispara el evento si no hay uno reciente."""
        cooldown = _COOLDOWN_MINUTES.get(obs.property_code, _DEFAULT_COOLDOWN_MINUTES)
        since = datetime.now(UTC) - timedelta(minutes=cooldown)
        recent = await self._alert_events.find_recent(rule.id, since)
        if recent is not None:
            return
        event = AlertEvent(
            id=uuid7(),
            alert_rule_id=rule.id,
            triggered_at=datetime.now(UTC),
            resolved_at=None,
            value=obs.value,
            message=message,
        )
        await self._alert_events.save(event)
        await self._notify_workspace(rule, obs, event)

    async def _notify_workspace(
        self,
        rule: AlertRule,
        obs: LatestObservationDTO,
        event: AlertEvent,
    ) -> None:
        """
        Envia email a todos los destinatarios del workspace.
        Los destinatarios son: owner_user_id + colaboradores activos.
        owner_org_id se ignora en MVP — rama de orgs no implementada.
        El fallo en el envio es silencioso: se loguea pero no propaga.
        """
        recipient_ids: set[UUID] = set()

        workspace = await self._workspaces.find_by_id(rule.workspace_id)
        if workspace is not None and workspace.owner_user_id is not None:
            recipient_ids.add(workspace.owner_user_id)

        collaborators = await self._collaborators.find_by_workspace(rule.workspace_id)
        for collab in collaborators:
            recipient_ids.add(collab.user_id)

        for user_id in recipient_ids:
            user = await self._users.find_by_id(user_id)
            if user is None or not user.is_active:
                continue
            try:
                await self._email.send_alert_event_email(
                    to_email=user.email,
                    name=user.first_name,
                    sensor_name=obs.sensor_name,
                    message=event.message,
                )
            except Exception:
                logger.warning(
                    "alert_email_failed",
                    user_id=str(user_id),
                    rule_id=str(rule.id),
                )
