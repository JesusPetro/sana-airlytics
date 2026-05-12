from __future__ import annotations

from pathlib import Path

import resend

from shared.infrastructure.logger import get_logger

logger = get_logger(__name__)

_TEMPLATES_DIR = Path(__file__).parent / "templates"


def _render(template_file: str, variables: dict[str, str]) -> str:
    html = (_TEMPLATES_DIR / template_file).read_text(encoding="utf-8")
    for key, value in variables.items():
        html = html.replace("{{{" + key + "}}}", value)
    return html


class EmailService:
    """
    Servicio de envio de correos electronicos via Resend.
    Renderiza los templates HTML locales e inyecta variables antes de enviar.
    """

    def __init__(
        self,
        api_key: str,
        from_email: str,
        frontend_url: str,
        template_reset_password: str,
        template_account_created: str,
        template_alert_event: str,
        template_collaborator_added: str,
    ) -> None:
        resend.api_key = api_key
        self._from = from_email
        self._frontend_url = frontend_url
        # template_* args kept for backwards compat — Resend templates API
        # is Broadcasts-only and does not support transactional sends.

    async def send_reset_password_email(
        self, to_email: str, name: str, reset_token: str
    ) -> bool:
        reset_link = f"{self._frontend_url}/reset-password?token={reset_token}"
        return await self._send(
            to=to_email,
            subject="SANA Airlytics — Restablecer contraseña",
            template_file="reset_password.html",
            variables={"name": name, "reset_link": reset_link},
        )

    async def send_account_created_email(self, to_email: str, name: str) -> bool:
        return await self._send(
            to=to_email,
            subject="SANA Airlytics — Bienvenido",
            template_file="create_account.html",
            variables={"name": name},
        )

    async def send_alert_event_email(
        self, to_email: str, name: str, sensor_name: str, message: str
    ) -> bool:
        return await self._send(
            to=to_email,
            subject="SANA Airlytics — Alerta de sensor",
            template_file="alert_event.html",
            variables={"name": name, "sensor_name": sensor_name, "message": message},
        )

    async def send_collaborator_added_email(
        self,
        to_email: str,
        invitee_name: str,
        actor_name: str,
        workspace_name: str,
        role: str,
    ) -> bool:
        return await self._send(
            to=to_email,
            subject=f"SANA Airlytics — Te han añadido a {workspace_name}",
            template_file="collaborator_added.html",
            variables={
                "invitee_name": invitee_name,
                "actor_name": actor_name,
                "workspace_name": workspace_name,
                "workspace_initial": workspace_name[0].upper(),
                "role": role,
                "platform_url": self._frontend_url,
            },
        )

    async def _send(
        self,
        to: str,
        subject: str,
        template_file: str,
        variables: dict[str, str],
    ) -> bool:
        try:
            html = _render(template_file, variables)
            resend.Emails.send({
                "from": self._from,
                "to": [to],
                "subject": subject,
                "html": html,
            })
            logger.info("Email enviado.", extra={"to": to, "template": template_file})
            return True
        except Exception as exc:
            logger.error("Error al enviar email: %s", exc, extra={"to": to})
            return False
