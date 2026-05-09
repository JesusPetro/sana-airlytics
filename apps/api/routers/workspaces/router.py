from __future__ import annotations

from shared.infrastructure.logger import get_logger
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from src.access_control.application.authorize_action import AuthorizeActionUseCase
from src.access_control.application.create_workspace import CreateWorkspaceUseCase
from src.access_control.application.dtos import (
    AuthorizeActionInput,
    CreateWorkspaceInput,
    InviteCollaboratorInput,
    UpdateWorkspaceInput,
)
from src.access_control.application.invite_collaborator import (
    CollaboratorAlreadyExistsError,
    InsufficientPrivilegesError,
    InviteCollaboratorUseCase,
)
from src.access_control.application.update_workspace import (
    UpdateWorkspaceUseCase,
    WorkspaceNotFoundError,
)
from src.access_control.domain.collaborator import Collaborator
from src.access_control.domain.ports.repositories import (
    CollaboratorRepository,
    WorkspaceRepository,
)
from src.access_control.domain.ports.token_service import TokenClaims
from src.access_control.domain.workspace import Workspace

from ...dependencies.auth import get_current_user
from ...dependencies.repositories import get_collaborator_repository, get_workspace_repository
from ...dependencies.use_cases import (
    get_authorize_use_case,
    get_create_workspace_use_case,
    get_invite_collaborator_use_case,
    get_update_workspace_use_case,
)
from .schemas import (
    ChangeCollaboratorRoleRequest,
    CollaboratorSummary,
    CreateWorkspaceRequest,
    CreateWorkspaceResponse,
    InviteCollaboratorRequest,
    UpdateWorkspaceRequest,
    WorkspaceSummary,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])

_CurrentUser = Annotated[TokenClaims, Depends(get_current_user)]
_AuthorizeUC = Annotated[AuthorizeActionUseCase, Depends(get_authorize_use_case)]
_CreateWsUC = Annotated[CreateWorkspaceUseCase, Depends(get_create_workspace_use_case)]
_InviteUC = Annotated[InviteCollaboratorUseCase, Depends(get_invite_collaborator_use_case)]
_WsRepo = Annotated[WorkspaceRepository, Depends(get_workspace_repository)]
_CollabRepo = Annotated[CollaboratorRepository, Depends(get_collaborator_repository)]
_UpdateWsUC = Annotated[UpdateWorkspaceUseCase, Depends(get_update_workspace_use_case)]


def _require_allowed(result) -> None:
    """
    Lanza HTTP 403 si el resultado de autorizacion indica acceso denegado.
    Funcion auxiliar para reducir repeticion en los endpoints.
    """
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result.reason or "Forbidden.",
        )


def _workspace_to_summary(ws: Workspace) -> WorkspaceSummary:
    """Convierte el agregado Workspace al schema de respuesta."""
    return WorkspaceSummary(
        workspace_id=str(ws.id),
        name=ws.name,
        description=None,
        is_private=ws.is_private,
        owner_user_id=str(ws.owner_user_id) if ws.owner_user_id else None,
        owner_org_id=str(ws.owner_org_id) if ws.owner_org_id else None,
    )


def _collaborator_to_summary(collab: Collaborator) -> CollaboratorSummary:
    """Convierte el agregado Collaborator al schema de respuesta."""
    return CollaboratorSummary(
        collaborator_id=str(collab.id),
        user_id=str(collab.user_id),
        workspace_id=str(collab.workspace_id),
        role=collab.role_name,
        is_active=collab.is_active,
    )


@router.post(
    "",
    response_model=CreateWorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un workspace personal",
    responses={
        401: {"description": "No autenticado."},
    },
)
async def create_workspace(
    body: CreateWorkspaceRequest,
    current_user: _CurrentUser,
    use_case: _CreateWsUC,
) -> CreateWorkspaceResponse:
    """
    Crea un workspace personal para el usuario autenticado.
    No requiere verificacion RBAC porque el workspace pertenece al propio usuario.
    """
    output = await use_case.execute(
        CreateWorkspaceInput(
            owner_user_id=current_user.user_id,
            name=body.name,
            description=body.description,
            is_private=body.is_private,
        )
    )
    logger.info("workspace_created", extra={"workspace_id": output.workspace_id, "user_id": current_user.user_id})
    return CreateWorkspaceResponse(workspace_id=output.workspace_id)


@router.get(
    "",
    response_model=list[WorkspaceSummary],
    summary="Listar workspaces del usuario autenticado",
    responses={
        401: {"description": "No autenticado."},
    },
)
async def list_workspaces(
    current_user: _CurrentUser,
    ws_repo: _WsRepo,
    collab_repo: _CollabRepo,
) -> list[WorkspaceSummary]:
    """
    Retorna todos los workspaces accesibles por el usuario:
    - Workspaces donde el usuario es owner (membership_type='owner').
    - Workspaces donde el usuario es colaborador activo (membership_type='collaborator').
    La lista esta deduplicada por workspace_id.
    """
    user_id = UUID(current_user.user_id)

    owned = await ws_repo.find_by_owner_user(user_id)
    owned_ids: set[UUID] = {ws.id for ws in owned}
    result: list[WorkspaceSummary] = [_workspace_to_summary(ws) for ws in owned]

    collabs = await collab_repo.find_by_user(user_id)
    for collab in collabs:
        if collab.workspace_id in owned_ids:
            continue
        ws = await ws_repo.find_by_id(collab.workspace_id)
        if ws is None:
            continue
        result.append(
            WorkspaceSummary(
                workspace_id=str(ws.id),
                name=ws.name,
                description=None,
                is_private=ws.is_private,
                owner_user_id=str(ws.owner_user_id) if ws.owner_user_id else None,
                owner_org_id=str(ws.owner_org_id) if ws.owner_org_id else None,
                role=collab.role_name,
                membership_type="collaborator",
            )
        )

    return result


@router.get(
    "/{ws_id}",
    response_model=WorkspaceSummary,
    summary="Detalle de un workspace",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin acceso al workspace."},
        404: {"description": "Workspace no encontrado."},
    },
)
async def get_workspace(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    ws_repo: _WsRepo,
) -> WorkspaceSummary:
    """Retorna el detalle de un workspace. Requiere al menos rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="sensor:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    ws = await ws_repo.find_by_id(UUID(ws_id))
    if ws is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    return _workspace_to_summary(ws)


@router.delete(
    "/{ws_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un workspace (soft delete)",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Solo admin u owner pueden eliminar el workspace."},
        404: {"description": "Workspace no encontrado."},
    },
)
async def delete_workspace(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    ws_repo: _WsRepo,
) -> None:
    """
    Realiza el soft delete del workspace. Requiere rol admin u owner.
    El workspace queda con deleted_at registrado y deja de aparecer en listados.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="workspace:delete",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    ws = await ws_repo.find_by_id(UUID(ws_id))
    if ws is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    # El soft delete se implementa via el ORM directamente desde el repositorio.
    # El dominio Workspace es inmutable (frozen dataclass), por lo que la operacion
    # de borrado se delega al metodo de repositorio que actualiza deleted_at en BD.
    await ws_repo.soft_delete(UUID(ws_id))
    logger.info("workspace_deleted", extra={"workspace_id": ws_id, "user_id": current_user.user_id})


@router.patch(
    "/{ws_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Editar metadatos de un workspace",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Solo admin u owner pueden editar el workspace."},
        404: {"description": "Workspace no encontrado."},
    },
)
async def update_workspace(
    ws_id: str,
    body: UpdateWorkspaceRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _UpdateWsUC,
) -> None:
    """Edita nombre, descripcion o visibilidad del workspace. Requiere rol admin u owner."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="workspace:delete",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)
    try:
        await use_case.execute(
            UpdateWorkspaceInput(
                workspace_id=ws_id,
                name=body.name,
                description=body.description,
                is_private=body.is_private,
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except WorkspaceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    logger.info("workspace_updated", extra={"workspace_id": ws_id, "user_id": current_user.user_id})


@router.post(
    "/{ws_id}/collaborators",
    status_code=status.HTTP_201_CREATED,
    summary="Invitar colaborador al workspace",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin permisos para invitar colaboradores."},
        404: {"description": "Usuario invitado no encontrado."},
        409: {"description": "El usuario ya es colaborador activo."},
    },
)
async def invite_collaborator(
    ws_id: str,
    body: InviteCollaboratorRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    use_case: _InviteUC,
) -> dict:
    """
    Invita a un usuario al workspace con el rol especificado.
    Requiere rol editor o superior.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="collaborator:invite",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    try:
        await use_case.execute(
            InviteCollaboratorInput(
                actor_user_id=current_user.user_id,
                workspace_id=ws_id,
                invitee_email=body.email,
                role_name=body.role,
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CollaboratorAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except InsufficientPrivilegesError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    logger.info("collaborator_invited", extra={"workspace_id": ws_id, "invitee": body.email})
    return {"message": "Collaborator invited successfully."}


@router.get(
    "/{ws_id}/collaborators",
    response_model=list[CollaboratorSummary],
    summary="Listar colaboradores del workspace",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin acceso al workspace."},
    },
)
async def list_collaborators(
    ws_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    collab_repo: _CollabRepo,
) -> list[CollaboratorSummary]:
    """Retorna la lista de colaboradores activos del workspace. Requiere rol viewer."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="sensor:read",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    collaborators = await collab_repo.find_by_workspace_with_user_info(UUID(ws_id))
    return [CollaboratorSummary(**c) for c in collaborators]


@router.patch(
    "/{ws_id}/collaborators/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Cambiar rol de un colaborador",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Sin permisos para cambiar roles."},
        404: {"description": "Colaborador no encontrado."},
    },
)
async def change_collaborator_role(
    ws_id: str,
    user_id: str,
    body: ChangeCollaboratorRoleRequest,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    collab_repo: _CollabRepo,
) -> dict:
    """Cambia el rol de un colaborador existente. Requiere rol editor o superior."""
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="collaborator:role_change",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    collab = await collab_repo.find(UUID(user_id), UUID(ws_id))
    if collab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found.",
        )

    # Se construye un nuevo Collaborator con el rol actualizado y se persiste.
    updated = Collaborator(
        id=collab.id,
        user_id=collab.user_id,
        workspace_id=collab.workspace_id,
        role_name=body.role,
        is_active=collab.is_active,
    )
    await collab_repo.save(updated)
    logger.info(
        "collaborator_role_changed",
        extra={"workspace_id": ws_id, "user_id": user_id, "new_role": body.role},
    )
    return {"message": "Role updated successfully."}


@router.delete(
    "/{ws_id}/collaborators/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revocar acceso de un colaborador",
    responses={
        401: {"description": "No autenticado."},
        403: {"description": "Solo admin u owner pueden revocar acceso."},
        404: {"description": "Colaborador no encontrado."},
    },
)
async def remove_collaborator(
    ws_id: str,
    user_id: str,
    current_user: _CurrentUser,
    authorize: _AuthorizeUC,
    collab_repo: _CollabRepo,
) -> None:
    """
    Revoca el acceso de un colaborador al workspace (is_active = False).
    Requiere rol admin u owner.
    """
    result = await authorize.execute(
        AuthorizeActionInput(
            user_id=current_user.user_id,
            action="collaborator:remove",
            workspace_id=ws_id,
        )
    )
    _require_allowed(result)

    collab = await collab_repo.find(UUID(user_id), UUID(ws_id))
    if collab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found.",
        )

    revoked = Collaborator(
        id=collab.id,
        user_id=collab.user_id,
        workspace_id=collab.workspace_id,
        role_name=collab.role_name,
        is_active=False,
    )
    await collab_repo.save(revoked)
    logger.info("collaborator_removed", extra={"workspace_id": ws_id, "user_id": user_id})
