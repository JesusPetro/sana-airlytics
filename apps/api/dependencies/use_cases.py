from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from src.access_control.application.authenticate_user import AuthenticateUserUseCase
from src.access_control.application.authorize_action import AuthorizeActionUseCase
from src.access_control.application.create_workspace import CreateWorkspaceUseCase
from src.access_control.application.invite_collaborator import InviteCollaboratorUseCase
from src.access_control.application.register_user import RegisterUserUseCase
from src.access_control.application.reset_password import ResetPasswordUseCase
from src.access_control.domain.ports.repositories import (
    AuditLogger,
    CollaboratorRepository,
    OrganizationRepository,
    UserRepository,
    WorkspaceRepository,
)
from src.access_control.domain.ports.token_service import TokenService
from src.access_control.domain.rbac_evaluator import RbacEvaluator
from src.device_management.application.claim_device import ClaimDeviceUseCase
from src.device_management.application.get_device_status import GetDeviceStatusUseCase
from src.device_management.application.register_device import RegisterDeviceUseCase
from src.device_management.application.update_device_config import UpdateDeviceConfigUseCase
from src.device_management.domain.ports.publishers import CommandPublisher
from src.device_management.domain.ports.repositories import DeviceRepository
from src.device_management.infrastructure.mqtt_command_publisher import MqttCommandPublisher
from shared.infrastructure.mqtt.config import MqttConfig

from .audit_logger import get_audit_logger
from .auth import get_token_service
from .repositories import (
    get_collaborator_repository,
    get_device_repository,
    get_org_repository,
    get_user_repository,
    get_workspace_repository,
)
from ..config.settings import settings

_UserRepo = Annotated[UserRepository, Depends(get_user_repository)]
_WorkspaceRepo = Annotated[WorkspaceRepository, Depends(get_workspace_repository)]
_CollabRepo = Annotated[CollaboratorRepository, Depends(get_collaborator_repository)]
_OrgRepo = Annotated[OrganizationRepository, Depends(get_org_repository)]
_DeviceRepo = Annotated[DeviceRepository, Depends(get_device_repository)]
_AuditLog = Annotated[AuditLogger, Depends(get_audit_logger)]
_TokenSvc = Annotated[TokenService, Depends(get_token_service)]


# --- access_control ---

def get_register_use_case(
    user_repo: _UserRepo,
    audit_logger: _AuditLog,
) -> RegisterUserUseCase:
    """Fabrica del caso de uso RegisterUser."""
    return RegisterUserUseCase(user_repo, audit_logger)


def get_authenticate_use_case(
    user_repo: _UserRepo,
    token_service: _TokenSvc,
    audit_logger: _AuditLog,
) -> AuthenticateUserUseCase:
    """Fabrica del caso de uso AuthenticateUser."""
    return AuthenticateUserUseCase(user_repo, token_service, audit_logger)


def get_reset_password_use_case(
    user_repo: _UserRepo,
    token_service: _TokenSvc,
) -> ResetPasswordUseCase:
    """Fabrica del caso de uso ResetPassword."""
    return ResetPasswordUseCase(user_repo, token_service)


def get_authorize_use_case(
    workspace_repo: _WorkspaceRepo,
    collaborator_repo: _CollabRepo,
    org_repo: _OrgRepo,
    audit_logger: _AuditLog,
) -> AuthorizeActionUseCase:
    """
    Fabrica del caso de uso AuthorizeAction.
    Compartido por todos los routers que requieren verificacion RBAC.
    """
    return AuthorizeActionUseCase(
        workspace_repo=workspace_repo,
        collaborator_repo=collaborator_repo,
        org_repo=org_repo,
        audit_logger=audit_logger,
        evaluator=RbacEvaluator(),
    )


def get_create_workspace_use_case(
    user_repo: _UserRepo,
    workspace_repo: _WorkspaceRepo,
    audit_logger: _AuditLog,
) -> CreateWorkspaceUseCase:
    """Fabrica del caso de uso CreateWorkspace."""
    return CreateWorkspaceUseCase(user_repo, workspace_repo, audit_logger)


def get_invite_collaborator_use_case(
    user_repo: _UserRepo,
    workspace_repo: _WorkspaceRepo,
    collaborator_repo: _CollabRepo,
    org_repo: _OrgRepo,
) -> InviteCollaboratorUseCase:
    """Fabrica del caso de uso InviteCollaborator."""
    return InviteCollaboratorUseCase(user_repo, workspace_repo, collaborator_repo, org_repo)


# --- device_management ---

def _get_mqtt_publisher() -> CommandPublisher:
    """
    Instancia el publicador MQTT para comandos de configuracion de devices.
    Las credenciales se leen desde settings. Si no estan configuradas,
    el publicador falla en tiempo de ejecucion con un error claro.
    """
    return MqttCommandPublisher(
        MqttConfig(
            host=settings.MQTT_HOST,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USERNAME,
            password=settings.MQTT_PASSWORD,
        )
    )


def get_register_device_use_case(
    device_repo: _DeviceRepo,
) -> RegisterDeviceUseCase:
    """Fabrica del caso de uso RegisterDevice."""
    return RegisterDeviceUseCase(device_repo)


def get_claim_device_use_case(
    device_repo: _DeviceRepo,
) -> ClaimDeviceUseCase:
    """Fabrica del caso de uso ClaimDevice."""
    return ClaimDeviceUseCase(device_repo)


def get_device_status_use_case(
    device_repo: _DeviceRepo,
) -> GetDeviceStatusUseCase:
    """Fabrica del caso de uso GetDeviceStatus."""
    return GetDeviceStatusUseCase(device_repo)


def get_update_device_config_use_case(
    device_repo: _DeviceRepo,
) -> UpdateDeviceConfigUseCase:
    """Fabrica del caso de uso UpdateDeviceConfig."""
    return UpdateDeviceConfigUseCase(device_repo, _get_mqtt_publisher())


# --- analytics ---

from src.analytics.application.get_datastreams import GetDatastreamsUseCase
from src.analytics.application.get_observations import GetObservationsUseCase
from src.analytics.application.get_aggregations import GetAggregationsUseCase
from src.analytics.application.get_sensor_location import GetSensorLocationUseCase
from src.analytics.application.get_sensor_track import GetSensorTrackUseCase
from src.analytics.application.get_heatmap import GetHeatmapUseCase
from src.analytics.application.create_annotation import CreateAnnotationUseCase
from src.analytics.application.get_annotations import GetAnnotationsUseCase
from src.analytics.application.update_annotation import UpdateAnnotationUseCase
from src.analytics.application.delete_annotation import DeleteAnnotationUseCase
from src.analytics.application.create_alert_rule import CreateAlertRuleUseCase
from src.analytics.application.get_alert_rules import GetAlertRulesUseCase
from src.analytics.application.update_alert_rule import UpdateAlertRuleUseCase
from src.analytics.application.delete_alert_rule import DeleteAlertRuleUseCase
from src.analytics.application.get_alert_events import GetAlertEventsUseCase
from src.analytics.application.create_zone import CreateZoneUseCase
from src.analytics.application.get_zones import GetZonesUseCase
from src.analytics.application.get_zone_health import GetZoneHealthUseCase
from src.analytics.infrastructure.postgres_datastream_repo import PostgresDatastreamReadRepository
from src.analytics.infrastructure.postgres_observation_repo import PostgresObservationReadRepository
from src.analytics.infrastructure.postgres_location_repo import PostgresLocationReadRepository
from src.analytics.infrastructure.postgres_annotation_repo import PostgresAnnotationRepository
from src.analytics.infrastructure.postgres_alert_rule_repo import PostgresAlertRuleRepository
from src.analytics.infrastructure.postgres_alert_event_repo import PostgresAlertEventRepository
from src.analytics.infrastructure.postgres_zone_repo import PostgresZoneRepository
from .repositories import (
    get_datastream_read_repository,
    get_observation_read_repository,
    get_location_read_repository,
    get_annotation_repository,
    get_alert_rule_repository,
    get_alert_event_repository,
    get_zone_repository,
)

_DsReadRepo = Annotated[PostgresDatastreamReadRepository, Depends(get_datastream_read_repository)]
_ObsReadRepo = Annotated[PostgresObservationReadRepository, Depends(get_observation_read_repository)]
_LocReadRepo = Annotated[PostgresLocationReadRepository, Depends(get_location_read_repository)]
_AnnotRepo = Annotated[PostgresAnnotationRepository, Depends(get_annotation_repository)]
_AlertRuleRepo = Annotated[PostgresAlertRuleRepository, Depends(get_alert_rule_repository)]
_AlertEventRepo = Annotated[PostgresAlertEventRepository, Depends(get_alert_event_repository)]
_ZoneRepo = Annotated[PostgresZoneRepository, Depends(get_zone_repository)]


def get_datastreams_use_case(repo: _DsReadRepo) -> GetDatastreamsUseCase:
    """Fabrica del caso de uso GetDatastreams."""
    return GetDatastreamsUseCase(repo)


def get_observations_use_case(repo: _ObsReadRepo) -> GetObservationsUseCase:
    """Fabrica del caso de uso GetObservations."""
    return GetObservationsUseCase(repo)


def get_aggregations_use_case(repo: _ObsReadRepo) -> GetAggregationsUseCase:
    """Fabrica del caso de uso GetAggregations."""
    return GetAggregationsUseCase(repo)


def get_sensor_location_use_case(repo: _LocReadRepo) -> GetSensorLocationUseCase:
    """Fabrica del caso de uso GetSensorLocation."""
    return GetSensorLocationUseCase(repo)


def get_sensor_track_use_case(repo: _LocReadRepo) -> GetSensorTrackUseCase:
    """Fabrica del caso de uso GetSensorTrack."""
    return GetSensorTrackUseCase(repo)


def get_heatmap_use_case(repo: _LocReadRepo) -> GetHeatmapUseCase:
    """Fabrica del caso de uso GetHeatmap."""
    return GetHeatmapUseCase(repo)


def get_create_annotation_use_case(repo: _AnnotRepo) -> CreateAnnotationUseCase:
    """Fabrica del caso de uso CreateAnnotation."""
    return CreateAnnotationUseCase(repo)


def get_annotations_use_case(repo: _AnnotRepo) -> GetAnnotationsUseCase:
    """Fabrica del caso de uso GetAnnotations."""
    return GetAnnotationsUseCase(repo)


def get_update_annotation_use_case(repo: _AnnotRepo) -> UpdateAnnotationUseCase:
    """Fabrica del caso de uso UpdateAnnotation."""
    return UpdateAnnotationUseCase(repo)


def get_delete_annotation_use_case(repo: _AnnotRepo) -> DeleteAnnotationUseCase:
    """Fabrica del caso de uso DeleteAnnotation."""
    return DeleteAnnotationUseCase(repo)


def get_create_alert_rule_use_case(repo: _AlertRuleRepo) -> CreateAlertRuleUseCase:
    """Fabrica del caso de uso CreateAlertRule."""
    return CreateAlertRuleUseCase(repo)


def get_alert_rules_use_case(repo: _AlertRuleRepo) -> GetAlertRulesUseCase:
    """Fabrica del caso de uso GetAlertRules."""
    return GetAlertRulesUseCase(repo)


def get_update_alert_rule_use_case(repo: _AlertRuleRepo) -> UpdateAlertRuleUseCase:
    """Fabrica del caso de uso UpdateAlertRule."""
    return UpdateAlertRuleUseCase(repo)


def get_delete_alert_rule_use_case(repo: _AlertRuleRepo) -> DeleteAlertRuleUseCase:
    """Fabrica del caso de uso DeleteAlertRule."""
    return DeleteAlertRuleUseCase(repo)


def get_alert_events_use_case(repo: _AlertEventRepo) -> GetAlertEventsUseCase:
    """Fabrica del caso de uso GetAlertEvents."""
    return GetAlertEventsUseCase(repo)


def get_create_zone_use_case(repo: _ZoneRepo) -> CreateZoneUseCase:
    """Fabrica del caso de uso CreateZone."""
    return CreateZoneUseCase(repo)


def get_zones_use_case(repo: _ZoneRepo) -> GetZonesUseCase:
    """Fabrica del caso de uso GetZones."""
    return GetZonesUseCase(repo)


def get_zone_health_use_case(repo: _ZoneRepo) -> GetZoneHealthUseCase:
    """Fabrica del caso de uso GetZoneHealth."""
    return GetZoneHealthUseCase(repo)
