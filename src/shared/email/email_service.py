from __future__ import annotations

import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

logger = logging.getLogger(__name__)

# Ruta al directorio de templates relativa a este archivo
_TEMPLATES_DIR = Path(__file__).parent / "templates"


def _load_template(name: str) -> str:
    """
    Carga el contenido de un template HTML desde el directorio templates/.
    Lanza FileNotFoundError si el template no existe.
    """
    path = _TEMPLATES_DIR / name
    return path.read_text(encoding="utf-8")


class EmailService:
    """
    Servicio de envio de correos electronicos via SMTP.
    Configurado para usar Mailtrap en development y SMTP real en production.
    Todas las credenciales se reciben via constructor desde variables de entorno.
    """

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_user: str,
        smtp_password: str,
        from_email: str,
        frontend_url: str,
        is_configured: bool,
    ) -> None:
        self._host = smtp_host
        self._port = smtp_port
        self._user = smtp_user
        self._password = smtp_password
        self._from = from_email
        self._frontend_url = frontend_url
        self._configured = is_configured

    async def send_reset_password_email(
        self, to_email: str, reset_token: str
    ) -> bool:
        """
        Envia el correo de reset de contrasena al usuario.
        El link de reset apunta a FRONTEND_URL/reset-password?token=<token>.
        Retorna True si el envio fue exitoso, False si fallo o SMTP no esta configurado.
        """
        if not self._configured:
            logger.warning(
                "SMTP no configurado — email de reset no enviado.",
                extra={"to": to_email},
            )
            return False

        reset_link = f"{self._frontend_url}/reset-password?token={reset_token}"

        try:
            html_body = _load_template("reset_password.html").replace(
                "{{reset_link}}", reset_link
            )
        except FileNotFoundError:
            logger.error("Template reset_password.html no encontrado.")
            return False

        message = MIMEMultipart("alternative")
        message["Subject"] = "SANA Airlytics — Reset de contrasena"
        message["From"] = self._from
        message["To"] = to_email
        message.attach(MIMEText(html_body, "html"))

        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self._host, self._port) as server:
                server.ehlo()
                server.starttls(context=context)
                server.login(self._user, self._password)
                server.sendmail(self._from, to_email, message.as_string())
            logger.info(
                "Email de reset enviado.", extra={"to": to_email}
            )
            return True
        except smtplib.SMTPException as exc:
            logger.error(
                "Error SMTP al enviar email de reset: %s",
                exc,
                extra={"to": to_email},
            )
            return False
