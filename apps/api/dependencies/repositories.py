from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.access_control.domain.ports.repositories import UserRepository
from src.access_control.infrastructure.postgres_user_repo import PostgresUserRepository

from .database import get_async_session

_Session = Annotated[AsyncSession, Depends(get_async_session)]


async def get_user_repository(db: _Session) -> UserRepository:
    return PostgresUserRepository(db)
