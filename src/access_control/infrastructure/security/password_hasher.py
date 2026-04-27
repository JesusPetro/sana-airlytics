from __future__ import annotations

import bcrypt


def hash_password(plain_password: str) -> str:
    """
    Genera el hash bcrypt de una contrasena en texto plano.
    Usa work factor 12 por defecto (balance seguridad/rendimiento).
    """
    return bcrypt.hashpw(
        plain_password.encode("utf-8"), bcrypt.gensalt(rounds=12)
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que una contrasena en texto plano coincida con su hash bcrypt.
    Retorna True si coincide, False en caso contrario.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )
