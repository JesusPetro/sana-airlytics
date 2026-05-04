from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.access_control.application.authorize_action import AuthorizeActionUseCase
from src.access_control.application.dtos import AuthorizeActionInput
from src.access_control.domain.ports.token_service import TokenClaims
from src.device_management.application.claim_device import ClaimDeviceUseCase
from src.device_management.application.dtos import (
    ClaimDeviceInput,
    RegisterDeviceInput,
    UpdateDeviceConfigInput,
)
from src.device_management.application.get_device_status import GetDeviceStatusUseCase
from src.device_management.application.register_device import (
    DeviceAlreadyExistsError,
    RegisterDeviceUseCase,
)
from src.device_management.application.update_device_config import UpdateDeviceConfigUseCase
from src.device_management.domain.errors import DeviceNotFoundError
from src.device_management.domain.ports.repositories import DeviceRepository

from ...dependencies.auth import get_current_user
from ...dependencies.repositories import get_device_repository
from ...dependencies.use_cases import (
    get_authorize_use_case,
    get_claim_device_use_case,
    get_device_status_use_case,
    get_register_device_use_case,
    get_update_device_config_use_case,
)
from .schemas import (
    ClaimDeviceRequest,
    DeviceStatusResponse,
    RegisterDeviceRequest,
    RegisterDeviceResponse,
    UpdateDeviceConfigRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Devices"])

_CurrentUser = Annotated[TokenClaims, Depends(get_current_user)]
_AuthorizeUC = Annotated[AuthorizeActionUseCase, Depends(get_authorize_use_case)]
_RegisterUC = Annotated[RegisterDeviceUseCase, Depends(get_register_device_use_case)]
_ClaimUC = Annotated[ClaimDeviceUseCase, Depends(get_claim_device_use_case)]
_StatusUC = Annotated[GetDeviceStatusUseCase, Depends(get_device_status_use_case)]
_UpdateConfigUC = Annotated[UpdateDeviceConfigUseCase, Depends(get_update_device_config_use_case)]
_DeviceRepo = Annotated[DeviceRepository, Depends(get_device_repository)]


def _require_allowed(result) -> None:
    """Lanza HTTP 403 si el resultado de autorizacion indica acceso denegado."""
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result.reason or "Forbidden.",
        )


@router.post(
    "/devices",
    response_model=RegisterDeviceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Pre-registrar un device nuevo",
    responses={
        401: {"description": "No autenticado."},
        409: {"description": "Ya existe un device con ese codigo."},
    },
)
async def register_device(
    body: RegisterDeviceRequest,
    current_user: _CurrentUser,
    use_case: _RegisterUC,
) -> RegisterDeviceResponse:
    """
    Registra un device nuevo en estado PENDING sin asignarlo a ningun workspace.
    El device queda disponible para ser reclamado via POST /devices/{device_id}/claim.
    No requiere verificacion RBAC de workspace porque el device aun no pertenece a ninguno.
    """
    try:
        output = await use_case.execute(
            RegisterDeviceInput(
                code=body.code,
                name=body.name,
                model=body.model,
                site_type=body.site_type,
                sampling_interval_seconds=body.sampling_interval_seconds,
                transmission_interval_seconds=body.transmission_interval_seconds,
            )
        )
    except DeviceAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    logger.info("device_registered", extra={"device_id": output.device_id, "code": output.code})
    return RegisterDeviceResponse(device_id=output.device_id, code=output.code)


@router.post(
    "/devices/{device_id}/claim",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reclamar un device PENDING y asignarlo a un workspace",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin permisos para registrar devices en este workspace."},
        404: {"description": "Device no encontrado."},
        409: {"description": "El device ya fue reclamado por otro workspace."},
    },
)
async def claim_device(
    device_id: str,
    body: ClaimDeviceRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _ClaimUC,
) -> None:
    """
    Asigna un device PENDING a un workspace y lo activa.
    Requiere rol editor o superior en el workspace de destino.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="sensor:register",
            workspace_id=body.workspace_id,
        )
    )
    _require_allowed(result)

    try:
        await use_case.execute(
            ClaimDeviceInput(code=device_id, workspace_id=body.workspace_id)
        )
    except DeviceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except Exception as exc:
        # DeviceAlreadyExistsError se usa tambien para devices ya reclamados
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    logger.info(
        "device_claimed",
        extra={
            "device_id": device_id,
            "workspace_id": body.workspace_id,
            "user_id": current_user.user_id,
        },
    )


@router.get(
    "/devices/{device_id}",
    response_model=DeviceStatusResponse,
    summary="Estado y configuracion de un device",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin acceso al workspace del device."},
        404: {"description": "Device no encontrado."},
    },
)
async def get_device_status(
    device_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _StatusUC,
    device_repo: _DeviceRepo,
) -> DeviceStatusResponse:
    """
    Retorna el estado completo de un device.
    La verificacion RBAC se hace contra el workspace al que pertenece el device.
    Si el device esta en estado PENDING (sin workspace), solo requiere autenticacion.
    """
    from shared.domain.device_id import DeviceId
    device = await device_repo.find_by_id(DeviceId(device_id))
    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found."
        )

    if device.workspace_id is not None:
        result = await authorize.execute(
            AuthorizeActionInput(
                user_id=current_user.user_id,
                action="sensor:read",
                workspace_id=device.workspace_id,
            )
        )
        _require_allowed(result)

    output = await use_case.execute(device_id)
    return DeviceStatusResponse(
        device_id=output.device_id,
        code=output.code,
        name=output.name,
        model=output.model,
        status=output.status,
        sampling_interval_seconds=output.sampling_interval_seconds,
        transmission_interval_seconds=output.transmission_interval_seconds,
        keepalive_seconds=output.keepalive_seconds,
        last_seen=output.last_seen,
        deactivated_at=output.deactivated_at,
        site_type=output.site_type,
        latitude=output.latitude,
        longitude=output.longitude,
        elevation=output.elevation,
    )


@router.get(
    "/workspaces/{ws_id}/devices",
    response_model=list[DeviceStatusResponse],
    summary="Listar devices de un workspace",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin acceso al workspace."},
    },
)
async def list_workspace_devices(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    device_repo: _DeviceRepo,
) -> list[DeviceStatusResponse]:
    """Retorna todos los devices activos del workspace. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="sensor:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    devices = await device_repo.find_by_workspace(ws_id)
    return [
        DeviceStatusResponse(
            device_id=str(d.id),
            code=d.code,
            name=d.name,
            model=d.model,
            status=d.status.value,
            sampling_interval_seconds=d.config.sampling_interval_seconds,
            transmission_interval_seconds=d.config.transmission_interval_seconds,
            keepalive_seconds=d.config.keepalive_seconds,
            last_seen=d.last_seen,
            deactivated_at=d.deactivated_at,
            site_type=d.site_type.value if d.site_type else None,
            latitude=d.location.latitude if d.location else None,
            longitude=d.location.longitude if d.location else None,
            elevation=d.location.elevation if d.location else None,
        )
        for d in devices
    ]


@router.patch(
    "/devices/{device_id}/config",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Actualizar intervalos de muestreo y transmision",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin permisos para modificar la config del device."},
        404: {"description": "Device no encontrado."},
        422: {"description": "Intervalos invalidos."},
    },
)
async def update_device_config(
    device_id: str,
    body: UpdateDeviceConfigRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _UpdateConfigUC,
    device_repo: _DeviceRepo,
) -> None:
    """
    Actualiza los intervalos de muestreo y transmision del device y publica
    la nueva config al broker MQTT. Requiere rol editor o superior en el workspace.
    """
    from shared.domain.device_id import DeviceId
    device = await device_repo.find_by_id(DeviceId(device_id))
    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found."
        )
    if device.workspace_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Device has no workspace assigned. Claim it first.",
        )

    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="sensor:register",
            workspace_id=device.workspace_id,
        )
    )
    _require_allowed(result)

    try:
        await use_case.execute(
            UpdateDeviceConfigInput(
                device_id=device_id,
                sampling_interval_seconds=body.sampling_interval_seconds,
                transmission_interval_seconds=body.transmission_interval_seconds,
            )
        )
    except DeviceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    logger.info(
        "device_config_updated",
        extra={"device_id": device_id, "user_id": current_user.user_id},
    )
