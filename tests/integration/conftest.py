import os

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv(encoding='utf-8')
from sqlalchemy.orm import Session

import access_control.infrastructure.orm_models  # noqa: F401
import data_ingestion.infrastructure.orm_models  # noqa: F401
import device_management.infrastructure.orm_models  # noqa: F401
import shared.infrastructure.orm_models  # noqa: F401
from shared.infrastructure.orm_base import Base


@pytest.fixture(scope="session")
def engine():
    url = os.environ["DATABASE_URL"].replace("+asyncpg", "+psycopg")
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
