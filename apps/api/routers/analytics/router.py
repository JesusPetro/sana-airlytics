from __future__ import annotations

import logging
from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.access_control.application.authorize_action import AuthorizeActionUseCase
from src.access_control.application.dtos import AuthorizeActionInput
from src.access_control.domain.ports.token_service import TokenClaims
from src.analytics.application.create_alert_rule import CreateAlertRuleUseCase
from src.analytics.application.create_annotation import CreateAnnotationUseCase
from src.analytics.application.create_zone import CreateZoneUseCase
from src.analytics.application.delete_alert_rule import DeleteAlertRuleUseCase
from src.analytics.application.delete_annotation import DeleteAnnotationUseCase
from src.analytics.application.dtos import (
    CreateAlertRuleInput,
    CreateAnnotationInput,
    CreateZoneInput,
    UpdateAlertRuleInput,
)
from src.analytics.application.update_annotation import (
    AnnotationNotFoundError,
    AnnotationNotOwnedError,
    UpdateAnnotationInput,
    UpdateAnnotationUseCase,
)
from src.analytics.application.get_aggregations import GetAggregationsUseCase
from src.analytics.application.get_alert_events import GetAlertEventsUseCase
from src.analytics.application.get_alert_rules import GetAlertRulesUseCase
from src.analytics.application.get_annotations import GetAnnotationsUseCase
from src.analytics.application.get_datastreams import GetDatastreamsUseCase
from src.analytics.application.get_heatmap import GetHeatmapUseCase
from src.analytics.application.get_observations import GetObservationsUseCase
from src.analytics.application.get_sensor_location import GetSensorLocationUseCase
from src.analytics.application.get_sensor_track import GetSensorTrackUseCase
from src.analytics.application.get_zone_health import GetZoneHealthUseCase, ZoneNotFoundError
from src.analytics.application.get_zones import GetZonesUseCase
from src.analytics.application.update_alert_rule import AlertRuleNotFoundError, UpdateAlertRuleUseCase

from ...dependencies.auth import get_current_user
from ...dependencies.repositories import get_annotation_repository
from src.analytics.infrastructure.postgres_annotation_repo import PostgresAnnotationRepository
from ...dependencies.use_cases import (
    get_aggregations_use_case,
    get_alert_events_use_case,
    get_alert_rules_use_case,
    get_annotations_use_case,
    get_authorize_use_case,
    get_create_alert_rule_use_case,
    get_create_annotation_use_case,
    get_create_zone_use_case,
    get_datastreams_use_case,
    get_delete_alert_rule_use_case,
    get_delete_annotation_use_case,
    get_heatmap_use_case,
    get_observations_use_case,
    get_sensor_location_use_case,
    get_sensor_track_use_case,
    get_update_alert_rule_use_case,
    get_update_annotation_use_case,
    get_zone_health_use_case,
    get_zones_use_case,
)
from .schemas import (
    AggregationBucketResponse,
    AlertEventResponse,
    AlertRuleResponse,
    AnnotationResponse,
    CreateAlertRuleRequest,
    CreateAnnotationRequest,
    CreateZoneRequest,
    DatastreamResponse,
    HeatmapPointResponse,
    LocationResponse,
    ObservationPointResponse,
    TrackPointResponse,
    UpdateAlertRuleRequest,
    UpdateAnnotationRequest,
    ZoneHealthResponse,
    ZoneResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Analytics"])

_CurrentUser = Annotated[TokenClaims, Depends(get_current_user)]
_AuthorizeUC = Annotated[AuthorizeActionUseCase, Depends(get_authorize_use_case)]
_GetDatastreamsUC = Annotated[GetDatastreamsUseCase, Depends(get_datastreams_use_case)]
_GetObsUC = Annotated[GetObservationsUseCase, Depends(get_observations_use_case)]
_GetAggUC = Annotated[GetAggregationsUseCase, Depends(get_aggregations_use_case)]
_GetLocUC = Annotated[GetSensorLocationUseCase, Depends(get_sensor_location_use_case)]
_GetTrackUC = Annotated[GetSensorTrackUseCase, Depends(get_sensor_track_use_case)]
_GetHeatmapUC = Annotated[GetHeatmapUseCase, Depends(get_heatmap_use_case)]
_AnnotRepo = Annotated[PostgresAnnotationRepository, Depends(get_annotation_repository)]
_CreateAnnotUC = Annotated[CreateAnnotationUseCase, Depends(get_create_annotation_use_case)]
_GetAnnotUC = Annotated[GetAnnotationsUseCase, Depends(get_annotations_use_case)]
_UpdateAnnotUC = Annotated[UpdateAnnotationUseCase, Depends(get_update_annotation_use_case)]
_DeleteAnnotUC = Annotated[DeleteAnnotationUseCase, Depends(get_delete_annotation_use_case)]
_CreateRuleUC = Annotated[CreateAlertRuleUseCase, Depends(get_create_alert_rule_use_case)]
_GetRulesUC = Annotated[GetAlertRulesUseCase, Depends(get_alert_rules_use_case)]
_UpdateRuleUC = Annotated[UpdateAlertRuleUseCase, Depends(get_update_alert_rule_use_case)]
_DeleteRuleUC = Annotated[DeleteAlertRuleUseCase, Depends(get_delete_alert_rule_use_case)]
_GetEventsUC = Annotated[GetAlertEventsUseCase, Depends(get_alert_events_use_case)]
_CreateZoneUC = Annotated[CreateZoneUseCase, Depends(get_create_zone_use_case)]
_GetZonesUC = Annotated[GetZonesUseCase, Depends(get_zones_use_case)]
_GetZoneHealthUC = Annotated[GetZoneHealthUseCase, Depends(get_zone_health_use_case)]


def _require_allowed(result) -> None:
    """Lanza HTTP 403 si el resultado de autorizacion indica acceso denegado."""
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result.reason or "Forbidden.",
        )


# Datastreams

@router.get(
    "/workspaces/{ws_id}/datastreams",
    response_model=list[DatastreamResponse],
    summary="Listar datastreams del workspace",
)
async def list_datastreams(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetDatastreamsUC,
) -> list[DatastreamResponse]:
    """Retorna los datastreams activos del workspace. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="observation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ws_id)
    return [DatastreamResponse(**vars(d)) for d in dtos]


# Observaciones

@router.get(
    "/workspaces/{ws_id}/datastreams/{ds_id}/observations",
    response_model=list[ObservationPointResponse],
    summary="Serie temporal cruda de un datastream",
)
async def get_observations(
    ws_id: str,
    ds_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetObsUC,
    from_dt: datetime = Query(..., alias="from"),
    to_dt: datetime = Query(..., alias="to"),
    qualifier: str | None = Query(None),
    exclude_oor: bool = Query(False),
) -> list[ObservationPointResponse]:
    """
    Retorna la serie temporal del datastream en el rango indicado.
    exclude_oor=true filtra observaciones fuera de rango del sensor.
    Requiere rol viewer.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="observation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ds_id, from_dt, to_dt, qualifier, exclude_oor)
    return [ObservationPointResponse(**vars(d)) for d in dtos]


# Agregaciones

@router.get(
    "/workspaces/{ws_id}/datastreams/{ds_id}/aggregations",
    response_model=list[AggregationBucketResponse],
    summary="Agregaciones temporales de un datastream",
)
async def get_aggregations(
    ws_id: str,
    ds_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetAggUC,
    from_dt: datetime = Query(..., alias="from"),
    to_dt: datetime = Query(..., alias="to"),
    bucket: str = Query("1h"),
) -> list[AggregationBucketResponse]:
    """
    Retorna agregaciones avg/min/max/count por bucket.
    bucket acepta '1h' o '1d'. Requiere rol viewer.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="observation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        dtos = await use_case.execute(ds_id, from_dt, to_dt, bucket)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return [AggregationBucketResponse(**vars(d)) for d in dtos]


# Geovisualizacion

@router.get(
    "/sensors/{sensor_id}/location",
    response_model=LocationResponse,
    summary="Ubicacion actual del sensor",
)
async def get_sensor_location(
    sensor_id: str,
    current_user: _CurrentUser,
    use_case: _GetLocUC,
) -> LocationResponse:
    """
    Retorna la ubicacion actual del sensor.
    Solo requiere autenticacion — la verificacion de workspace se omite
    porque el sensor_id es publico dentro del sistema autenticado.
    """
    dto = await use_case.execute(sensor_id)
    if dto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found for this sensor.",
        )
    return LocationResponse(**vars(dto))


@router.get(
    "/sensors/{sensor_id}/track",
    response_model=list[TrackPointResponse],
    summary="Trayectoria historica del sensor",
)
async def get_sensor_track(
    sensor_id: str,
    current_user: _CurrentUser,
    use_case: _GetTrackUC,
    from_dt: datetime = Query(..., alias="from"),
    to_dt: datetime = Query(..., alias="to"),
) -> list[TrackPointResponse]:
    """Retorna la trayectoria GPS historica del sensor en el rango indicado."""
    dtos = await use_case.execute(sensor_id, from_dt, to_dt)
    return [TrackPointResponse(**vars(d)) for d in dtos]


@router.get(
    "/workspaces/{ws_id}/heatmap",
    response_model=list[HeatmapPointResponse],
    summary="Puntos de mapa de calor por contaminante",
)
async def get_heatmap(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetHeatmapUC,
    property_code: str = Query(...),
    from_dt: datetime = Query(..., alias="from"),
    to_dt: datetime = Query(..., alias="to"),
) -> list[HeatmapPointResponse]:
    """
    Retorna pares lat/lon con el valor promedio de la variable indicada.
    Requiere rol viewer.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="observation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ws_id, property_code, from_dt, to_dt)
    return [HeatmapPointResponse(**vars(d)) for d in dtos]


# Anotaciones

@router.post(
    "/workspaces/{ws_id}/annotations",
    response_model=AnnotationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear anotacion sobre una entidad",
)
async def create_annotation(
    ws_id: str,
    body: CreateAnnotationRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _CreateAnnotUC,
) -> AnnotationResponse:
    """Crea una anotacion vinculada a un sensor, datastream u observacion. Requiere rol editor."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="annotation:create",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dto = await use_case.execute(
        CreateAnnotationInput(
            workspace_id=ws_id,
            entity_type=body.entity_type,
            entity_id=body.entity_id,
            body=body.body,
            created_by=current_user.user_id,
        )
    )
    return AnnotationResponse(**vars(dto))


@router.get(
    "/workspaces/{ws_id}/annotations",
    response_model=list[AnnotationResponse],
    summary="Listar anotaciones del workspace",
)
async def list_annotations(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetAnnotUC,
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
) -> list[AnnotationResponse]:
    """Retorna anotaciones filtradas por entidad. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="annotation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ws_id, entity_type, entity_id)
    return [AnnotationResponse(**vars(d)) for d in dtos]


@router.get(
    "/workspaces/{ws_id}/annotations/{annotation_id}",
    response_model=AnnotationResponse,
    summary="Detalle de una anotacion",
)
async def get_annotation(
    ws_id: str,
    annotation_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    repo: _AnnotRepo,
) -> AnnotationResponse:
    """Retorna una anotacion por ID. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="annotation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    annotation = await repo.find_by_id(UUID(annotation_id))
    if annotation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found.")
    return AnnotationResponse(
        annotation_id=str(annotation.id),
        entity_type=annotation.entity_type,
        entity_id=str(annotation.entity_id),
        body=annotation.body,
        created_by=str(annotation.created_by),
        created_at=annotation.created_at,
    )


@router.patch(
    "/workspaces/{ws_id}/annotations/{annotation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Editar cuerpo de una anotacion",
)
async def update_annotation(
    ws_id: str,
    annotation_id: str,
    body: UpdateAnnotationRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _UpdateAnnotUC,
) -> None:
    """Edita el cuerpo de la anotacion. Solo el creador puede modificarla. Requiere rol editor."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="annotation:create",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        await use_case.execute(
            UpdateAnnotationInput(
                annotation_id=annotation_id,
                body=body.body,
                requesting_user_id=current_user.user_id,
            )
        )
    except AnnotationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except AnnotationNotOwnedError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the annotation owner.")


@router.delete(
    "/workspaces/{ws_id}/annotations/{annotation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una anotacion",
)
async def delete_annotation(
    ws_id: str,
    annotation_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _DeleteAnnotUC,
) -> None:
    """Elimina la anotacion. Solo el creador puede eliminarla. Requiere rol editor."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="annotation:create",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        await use_case.execute(annotation_id, current_user.user_id)
    except AnnotationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except AnnotationNotOwnedError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the annotation owner.")


# Alertas

@router.post(
    "/workspaces/{ws_id}/alert-rules",
    response_model=AlertRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear regla de alerta",
)
async def create_alert_rule(
    ws_id: str,
    body: CreateAlertRuleRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _CreateRuleUC,
) -> AlertRuleResponse:
    """Crea una regla de alerta en el workspace. Requiere rol editor."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="alert_rule:create",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        dto = await use_case.execute(
            CreateAlertRuleInput(
                workspace_id=ws_id,
                unit_id=body.unit_id,
                name=body.name,
                metric=body.metric,
                operator=body.operator,
                threshold=body.threshold,
                created_by=current_user.user_id,
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return AlertRuleResponse(**vars(dto))


@router.get(
    "/workspaces/{ws_id}/alert-rules",
    response_model=list[AlertRuleResponse],
    summary="Listar reglas de alerta del workspace",
)
async def list_alert_rules(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetRulesUC,
) -> list[AlertRuleResponse]:
    """Retorna todas las reglas del workspace. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="observation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ws_id)
    return [AlertRuleResponse(**vars(d)) for d in dtos]


@router.patch(
    "/workspaces/{ws_id}/alert-rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Activar o desactivar regla de alerta",
)
async def update_alert_rule(
    ws_id: str,
    rule_id: str,
    body: UpdateAlertRuleRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _UpdateRuleUC,
) -> None:
    """Activa o desactiva la regla indicada. Requiere rol editor."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="alert_rule:create",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        await use_case.execute(UpdateAlertRuleInput(rule_id=rule_id, is_active=body.is_active))
    except AlertRuleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete(
    "/workspaces/{ws_id}/alert-rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar regla de alerta",
)
async def delete_alert_rule(
    ws_id: str,
    rule_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _DeleteRuleUC,
) -> None:
    """Elimina la regla fisicamente. Requiere rol admin."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="alert_rule:delete",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        await use_case.execute(rule_id)
    except AlertRuleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/workspaces/{ws_id}/alert-events",
    response_model=list[AlertEventResponse],
    summary="Historico de eventos de alerta",
)
async def list_alert_events(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetEventsUC,
    from_dt: datetime | None = Query(None, alias="from"),
    to_dt: datetime | None = Query(None, alias="to"),
) -> list[AlertEventResponse]:
    """Retorna el historico de alertas disparadas. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="observation:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ws_id, from_dt, to_dt)
    return [AlertEventResponse(**vars(d)) for d in dtos]


# Zonas

@router.post(
    "/workspaces/{ws_id}/zones",
    response_model=ZoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear zona geografica",
)
async def create_zone(
    ws_id: str,
    body: CreateZoneRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _CreateZoneUC,
) -> ZoneResponse:
    """Crea una zona geografica circular en el workspace. Requiere rol editor."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="annotation:create",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        dto = await use_case.execute(
            CreateZoneInput(
                workspace_id=ws_id,
                name=body.name,
                center_lat=body.center_lat,
                center_lon=body.center_lon,
                radius_m=body.radius_m,
                created_by=current_user.user_id,
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return ZoneResponse(**vars(dto))


@router.get(
    "/workspaces/{ws_id}/zones",
    response_model=list[ZoneResponse],
    summary="Listar zonas del workspace",
)
async def list_zones(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _GetZonesUC,
) -> list[ZoneResponse]:
    """Retorna todas las zonas del workspace. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="sensor:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    dtos = await use_case.execute(ws_id)
    return [ZoneResponse(**vars(d)) for d in dtos]


@router.get(
    "/zones/{zone_id}/health",
    response_model=ZoneHealthResponse,
    summary="Veredicto de calidad del aire de una zona",
)
async def get_zone_health(
    zone_id: str,
    current_user: _CurrentUser,
    use_case: _GetZoneHealthUC,
    hours: int = Query(24),
) -> ZoneHealthResponse:
    """
    Retorna el veredicto de calidad del aire de la zona para las ultimas `hours` horas.
    Solo requiere autenticacion.
    """
    try:
        dto = await use_case.execute(zone_id, hours)
    except ZoneNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return ZoneHealthResponse(
        zone_id=dto.zone_id,
        zone_name=dto.zone_name,
        overall_verdict=dto.overall_verdict,
        variables=[
            {"property_code": v["property_code"], "avg_value": v["avg_value"], "verdict": v["verdict"]}
            for v in dto.variables
        ],
        evaluated_hours=dto.evaluated_hours,
    )
