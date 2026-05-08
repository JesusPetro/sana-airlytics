from __future__ import annotations

import logging

from ..domain.ports.repositories import UserRepository
from ..domain.ports.token_service import TokenService
from .dtos import RequestPasswordResetInput, RequestPasswordResetOutput

logger = logging.getLogger(__name__)


class RequestPasswordResetUseCase:
    """
    Caso de uso: solicitar el inicio del flujo de reset de contrasena.

    La respuesta es siempre generica para no revelar si el email existe
    en el sistema (prevencion de enumeracion de usuarios).
    """

    def __init__(
        self,
        user_repo: UserRepository,
        token_service: TokenService,
        email_sender,  # EmailService — tipado como Any para evitar acoplamiento
        is_development: bool = False,
        resend_configured: bool = False,
    ) -> None:
        self._users = user_repo
        self._tokens = token_service
        self._email = email_sender
        self._is_dev = is_development
        self._resend_ok = resend_configured

    async def execute(
        self, cmd: RequestPasswordResetInput
    ) -> RequestPasswordResetOutput:
        """
        Genera un token de reset y lo envia por email si el usuario existe.
        Si el usuario no existe, retorna la misma respuesta generica.
        En development sin SMTP, expone el token en el output para facilitar pruebas.
        """
        generic_message = (
            "If the email exists, you will receive reset instructions."
        )

        user = await self._users.find_by_email(cmd.email)

        if user is None:
            # No revelar si el email existe o no
            logger.info(
                "Solicitud de reset para email no registrado — respuesta generica enviada."
            )
            return RequestPasswordResetOutput(message=generic_message)

        reset_token = self._tokens.generate_reset_token(user.email)

        email_sent = await self._email.send_reset_password_email(
            to_email=user.email,
            name=user.first_name,
            reset_token=reset_token,
        )

        if self._is_dev and not self._resend_ok:
            logger.debug(
                "SMTP no configurado en development — token de reset expuesto en respuesta."
            )
            return RequestPasswordResetOutput(
                message=generic_message,
                reset_token=reset_token,
                dev_note=(
                    "SMTP not configured -- token exposed for development testing only. "
                    "Configure RESEND_* variables in .env to test real email sending."
                ),
            )

        if email_sent:
            logger.info(
                "Email de reset enviado correctamente.", extra={"email": user.email}
            )
        else:
            logger.error(
                "Fallo al enviar email de reset.",
                extra={"email": user.email},
            )

        return RequestPasswordResetOutput(message=generic_message)
