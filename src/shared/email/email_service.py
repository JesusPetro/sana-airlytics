from __future__ import annotations

import logging

import resend

logger = logging.getLogger(__name__)


class EmailService:
    """
    Servicio de envio de correos electronicos via Resend.
    Usa plantillas pre-registradas en Resend identificadas por su template ID.
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
        self._tpl_reset_password = template_reset_password
        self._tpl_account_created = template_account_created
        self._tpl_alert_event = template_alert_event
        self._tpl_collaborator_added = template_collaborator_added

    async def send_reset_password_email(
        self, to_email: str, name: str, reset_token: str
    ) -> bool:
        reset_link = f"{self._frontend_url}/reset-password?token={reset_token}"
        return await self._send(
            to=to_email,
            subject="SANA Airlytics — Restablecer contraseña",
            template_id=self._tpl_reset_password,
            variables={"name": name, "reset_link": reset_link},
        )

    async def send_account_created_email(self, to_email: str, name: str) -> bool:
        return await self._send(
            to=to_email,
            subject="SANA Airlytics — Bienvenido",
            template_id=self._tpl_account_created,
            variables={"name": name},
        )

    async def send_alert_event_email(
        self, to_email: str, name: str, sensor_name: str, message: str
    ) -> bool:
        return await self._send(
            to=to_email,
            subject="SANA Airlytics — Alerta de sensor",
            template_id=self._tpl_alert_event,
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
            template_id=self._tpl_collaborator_added,
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
        template_id: str,
        variables: dict[str, str],
    ) -> bool:
        try:
            resend.Emails.send({
                "from": self._from,
                "to": [to],
                "subject": subject,
                "template_id": template_id,
                "variables": variables,
            })
            logger.info("Email enviado.", extra={"to": to, "template": template_id})
            return True
        except Exception as exc:
            logger.error("Error al enviar email: %s", exc, extra={"to": to})
            return False
