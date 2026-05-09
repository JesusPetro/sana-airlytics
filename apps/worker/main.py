# ruff: noqa: E402, I001
from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import asyncio
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.access_control.infrastructure.postgres_collaborator_repo import (
    PostgresCollaboratorRepository,
)
from src.access_control.infrastructure.postgres_user_repo import PostgresUserRepository
from src.access_control.infrastructure.postgres_workspace_repo import (
    PostgresWorkspaceRepository,
)
from src.analytics.application.evaluate_alert_rules import EvaluateAlertRulesUseCase
from src.analytics.infrastructure.postgres_alert_event_repo import (
    PostgresAlertEventRepository,
)
from src.analytics.infrastructure.postgres_alert_rule_repo import (
    PostgresAlertRuleRepository,
)
from src.analytics.infrastructure.postgres_latest_obs_repo import (
    PostgresLatestObservationRepository,
)
from src.shared.email.email_service import EmailService
from shared.infrastructure.logger import get_logger

logger = get_logger(__name__)

_EVAL_INTERVAL_SECONDS: int = 300  # 5 minutos


def _make_email_service() -> EmailService:
    return EmailService(
        api_key=os.environ["RESEND_API_KEY"],
        from_email=os.environ["RESEND_FROM_EMAIL"],
        frontend_url=os.environ["FRONTEND_URL"],
        template_reset_password=os.environ["RESEND_TEMPLATE_RESET_PASSWORD"],
        template_account_created=os.environ["RESEND_TEMPLATE_ACCOUNT_CREATED"],
        template_alert_event=os.environ["RESEND_TEMPLATE_ALERT_EVENT"],
        template_collaborator_added=os.environ["RESEND_TEMPLATE_COLLABORATOR_ADDED"],
    )


def _make_use_case(session: AsyncSession) -> EvaluateAlertRulesUseCase:
    return EvaluateAlertRulesUseCase(
        alert_rule_repo=PostgresAlertRuleRepository(session),
        alert_event_repo=PostgresAlertEventRepository(session),
        latest_obs_repo=PostgresLatestObservationRepository(session),
        collaborator_repo=PostgresCollaboratorRepository(session),
        workspace_repo=PostgresWorkspaceRepository(session),
        user_repo=PostgresUserRepository(session),
        email_service=_make_email_service(),
    )


async def main() -> None:
    engine = create_async_engine(os.environ["DATABASE_URL"])
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    logger.info("alert_worker_starting", interval_seconds=_EVAL_INTERVAL_SECONDS)

    while True:
        try:
            async with session_factory() as session, session.begin():
                use_case = _make_use_case(session)
                await use_case.execute()
            logger.info("alert_worker_cycle_complete")
        except Exception as exc:
            logger.error("alert_worker_cycle_error", error=str(exc), exc_info=True)
        await asyncio.sleep(_EVAL_INTERVAL_SECONDS)


if __name__ == "__main__":
    loop = asyncio.SelectorEventLoop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        pass
