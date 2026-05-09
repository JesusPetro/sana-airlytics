import os
from pathlib import Path

import resend
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")


def template_create_account() -> None:
    html = (ROOT / "src/shared/email/templates/create_account.html").read_text(encoding="utf-8")
    resend.Templates.create({
        "from": "SANA Airlytics <no-reply@mg.airlytics.tech>",
        "name": "create-account",
        "subject": "¡Bienvenido a SANA Airlytics!",
        "preview_text": "Tu cuenta ha sido creada. Comienza a monitorear tus sensores.",
        "html": html,
        "text": (
            "Hola, {{{name}}}. Tu cuenta en SANA Airlytics ha sido creada exitosamente. "
            "Si tienes alguna duda, no dudes en contactarnos."
        ),
        "variables": [
            {
                "key": "name",
                "type": "string",
                "fallback_value": "Usuario",
            },
        ],
    })


if __name__ == "__main__":
    if not RESEND_API_KEY:
        print("ERROR: RESEND_API_KEY is not set. Add it to your .env file.")
        exit(1)

    resend.api_key = RESEND_API_KEY

    template_create_account()
