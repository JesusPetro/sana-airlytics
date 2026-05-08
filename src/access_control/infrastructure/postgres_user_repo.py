from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.user import User
from .orm_models import UserModel


class PostgresUserRepository:
    """Adaptador conducido: implementa UserRepository sobre PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, user: User) -> None:
        """Inserta o actualiza el usuario en la BD."""
        model = UserModel(
            id=user.id,
            email=user.email,
            password_hash=user.password_hash,
            first_name=user.first_name,
            last_name=user.last_name,
            middle_name=user.middle_name,
            phone=user.phone,
            address=user.address,
            type=user.type,
            is_active=user.is_active,
            deleted_at=user.deleted_at,
        )
        await self._session.merge(model)
        await self._session.flush()

    async def find_by_id(self, user_id: UUID) -> User | None:
        """Retorna el usuario por ID o None si no existe."""
        model = await self._session.get(UserModel, user_id)
        if model is None:
            return None
        return self._to_domain(model)

    async def find_by_email(self, email: str) -> User | None:
        """Busqueda case-insensitive por email."""
        stmt = select(UserModel).where(
            UserModel.email == email.lower().strip()
        )
        model = (await self._session.execute(stmt)).scalar_one_or_none()
        if model is None:
            return None
        return self._to_domain(model)

    def _to_domain(self, model: UserModel) -> User:
        """Convierte un modelo ORM al agregado de dominio."""
        return User(
            id=model.id,
            email=model.email,
            password_hash=model.password_hash,
            first_name=model.first_name,
            last_name=model.last_name,
            middle_name=model.middle_name,
            phone=model.phone,
            address=model.address,
            type=model.type,
            is_active=model.is_active,
            deleted_at=model.deleted_at,
        )

    async def update_profile(
        self,
        user_id: UUID,
        first_name: str | None,
        last_name: str | None,
        middle_name: str | None,
        phone: str | None,
        address: str | None,
    ) -> None:
        """
        Actualiza solo los campos no None del perfil.
        Nunca modifica email ni password_hash.
        """
        values: dict = {}
        if first_name is not None:
            values["first_name"] = first_name
        if last_name is not None:
            values["last_name"] = last_name
        if middle_name is not None:
            values["middle_name"] = middle_name
        if phone is not None:
            values["phone"] = phone
        if address is not None:
            values["address"] = address
        if not values:
            return
        stmt = update(UserModel).where(UserModel.id == user_id).values(**values)
        await self._session.execute(stmt)
        await self._session.flush()

    async def deactivate(self, user_id: UUID) -> None:
        """Marca la cuenta como inactiva con soft delete."""
        stmt = (
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(is_active=False, deleted_at=datetime.now(UTC))
        )
        await self._session.execute(stmt)
        await self._session.flush()
