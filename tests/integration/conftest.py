import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import access_control.infrastructure.orm_models  # noqa: F401
import data_ingestion.infrastructure.orm_models  # noqa: F401
import device_management.infrastructure.orm_models  # noqa: F401
import shared.infrastructure.orm_models  # noqa: F401
from shared.infrastructure.orm_base import Base


@pytest.fixture(scope="session")
def engine():
    url = os.environ["DATABASE_URL"].replace("+asyncpg", "")
    return create_engine(url)


@pytest.fixture
def session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
