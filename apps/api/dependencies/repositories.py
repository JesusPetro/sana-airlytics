from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.access_control.domain.ports.repositories import (
    CollaboratorRepository,
    OrganizationRepository,
    UserRepository,
    WorkspaceRepository,
)
from src.access_control.infrastructure.postgres_collaborator_repo import (
    PostgresCollaboratorRepository,
)
from src.access_control.infrastructure.postgres_org_repo import PostgresOrganizationRepository
from src.access_control.infrastructure.postgres_user_repo import PostgresUserRepository
from src.access_control.infrastructure.postgres_workspace_repo import (
    PostgresWorkspaceRepository,
)
from src.device_management.domain.ports.repositories import DeviceRepository
from src.device_management.infrastructure.postgres_device_repo import PostgresDeviceRepository

from .database import get_async_session

_Session = Annotated[AsyncSession, Depends(get_async_session)]


async def get_user_repository(db: _Session) -> UserRepository:
    """Retorna el repositorio de usuarios con la sesion activa."""
    return PostgresUserRepository(db)


async def get_workspace_repository(db: _Session) -> WorkspaceRepository:
    """Retorna el repositorio de workspaces con la sesion activa."""
    return PostgresWorkspaceRepository(db)


async def get_collaborator_repository(db: _Session) -> CollaboratorRepository:
    """Retorna el repositorio de colaboradores con la sesion activa."""
    return PostgresCollaboratorRepository(db)


async def get_org_repository(db: _Session) -> OrganizationRepository:
    """Retorna el repositorio de organizaciones con la sesion activa."""
    return PostgresOrganizationRepository(db)


async def get_device_repository(db: _Session) -> DeviceRepository:
    """Retorna el repositorio de devices con la sesion activa."""
    return PostgresDeviceRepository(db)
