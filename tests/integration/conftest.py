import os

import pytest_asyncio
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv(encoding='utf-8')

import access_control.infrastructure.orm_models  # noqa: F401
import data_ingestion.infrastructure.orm_models  # noqa: F401
import device_management.infrastructure.orm_models  # noqa: F401
import shared.infrastructure.orm_models  # noqa: F401

_TABLES = [
    "annotations",
    "observations",
    "datastream_tags",
    "datastreams",
    "historical_locations",
    "locations",
    "collaborators",
    "sensors",
    "workspaces",
    "organizations",
    "roles",
    "users",
]


@pytest_asyncio.fixture(scope="session")
async def async_engine():
    url = os.environ["DATABASE_URL"]
    if "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(url)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
def session_factory(async_engine):
    return async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def session(async_engine, session_factory):
    async with session_factory() as s:
        yield s
        await s.rollback()

    # truncate all test data after each test
    async with async_engine.begin() as conn:
        tables = ", ".join(_TABLES)
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
