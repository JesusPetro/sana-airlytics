from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from src.access_control.application.authenticate_user import (
    AuthenticateUserUseCase,
    AuthenticationError,
)
from src.access_control.application.register_user import (
    EmailAlreadyRegisteredError,
    RegisterUserUseCase,
)
from src.access_control.application.request_password_reset import (
    RequestPasswordResetUseCase,
)
from src.access_control.application.reset_password import (
    ResetPasswordError,
    ResetPasswordUseCase,
)
from src.access_control.application.dtos import (
    LoginInput,
    RegisterUserInput,
    RequestPasswordResetInput,
    ResetPasswordInput,
)
from src.access_control.domain.user import PasswordTooWeakError
from src.access_control.infrastructure.jwt_token_service import JwtTokenService
from src.access_control.infrastructure.no_op_audit_logger import NoOpAuditLogger
from src.access_control.infrastructure.postgres_user_repo import PostgresUserRepository
from src.access_control.domain.ports.token_service import TokenClaims
from src.shared.email.email_service import EmailService

from ...config.settings import settings
from ...dependencies.auth import get_current_user, get_token_service
from ...dependencies.database import get_async_session
from .schemas import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
    RequestResetRequest,
    ResetPasswordRequest,
    TokenDevResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Helpers de construccion de casos de uso
# Cada helper construye el caso de uso inyectando sus dependencias.
# ---------------------------------------------------------------------------

def _build_register_use_case(
    db: AsyncSession,
) -> RegisterUserUseCase:
    """Construye el caso de uso de registro con sus dependencias."""
    return RegisterUserUseCase(
        user_repo=PostgresUserRepository(db),
        audit_logger=NoOpAuditLogger(),
    )


def _build_authenticate_use_case(
    db: AsyncSession,
    token_service: JwtTokenService,
) -> AuthenticateUserUseCase:
    """Construye el caso de uso de autenticacion con sus dependencias."""
    return AuthenticateUserUseCase(
        user_repo=PostgresUserRepository(db),
        token_service=token_service,
        audit_logger=NoOpAuditLogger(),
    )


def _build_request_reset_use_case(db: AsyncSession) -> RequestPasswordResetUseCase:
    """Construye el caso de uso de solicitud de reset con sus dependencias."""
    token_service = JwtTokenService(
        secret_key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
        access_expire_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_expire_days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS,
        reset_expire_minutes=settings.JWT_RESET_TOKEN_EXPIRE_MINUTES,
    )
    email_service = EmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_user=settings.SMTP_USER,
        smtp_password=settings.SMTP_PASSWORD,
        from_email=settings.SMTP_FROM_EMAIL,
        frontend_url=settings.FRONTEND_URL,
        is_configured=settings.smtp_configured,
    )
    return RequestPasswordResetUseCase(
        user_repo=PostgresUserRepository(db),
        token_service=token_service,
        email_sender=email_service,
        is_development=settings.is_development,
        smtp_configured=settings.smtp_configured,
    )


def _build_reset_password_use_case(db: AsyncSession) -> ResetPasswordUseCase:
    """Construye el caso de uso de confirmacion de reset con sus dependencias."""
    token_service = JwtTokenService(
        secret_key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
        access_expire_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_expire_days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS,
        reset_expire_minutes=settings.JWT_RESET_TOKEN_EXPIRE_MINUTES,
    )
    return ResetPasswordUseCase(
        user_repo=PostgresUserRepository(db),
        token_service=token_service,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario",
    responses={
        409: {"description": "El email ya esta registrado."},
        422: {"description": "La contrasena no cumple los requisitos."},
    },
)
@limiter.limit("3/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_async_session),
) -> RegisterResponse:
    """
    Registra un nuevo usuario en la plataforma.

    La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula,
    un numero y un caracter especial. El email debe ser unico en el sistema.
    """
    use_case = _build_register_use_case(db)
    cmd = RegisterUserInput(
        email=str(body.email),
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    try:
        output = await use_case.execute(cmd)
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )
    except PasswordTooWeakError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    logger.info("Usuario registrado correctamente.", extra={"user_id": output.user_id})
    return RegisterResponse(
        message="User registered successfully.",
        user_id=output.user_id,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Iniciar sesion",
    responses={
        401: {"description": "Credenciales invalidas o cuenta desactivada."},
    },
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_async_session),
    token_service: JwtTokenService = Depends(get_token_service),
) -> LoginResponse:
    """
    Autentica al usuario y establece las cookies de sesion httponly.

    El JWT nunca se expone en el body del response en production.
    El navegador enviara la cookie automaticamente en cada request posterior.
    """
    use_case = _build_authenticate_use_case(db, token_service)
    cmd = LoginInput(email=str(body.email), password=body.password)

    try:
        output = await use_case.execute(cmd)
    except AuthenticationError:
        logger.warning(
            "Intento de login fallido.", extra={"email": str(body.email)}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    response.set_cookie(value=output.access_token, **settings.cookie_config)
    response.set_cookie(value=output.refresh_token, **settings.refresh_cookie_config)

    logger.info("Login exitoso.", extra={"user_id": output.user_id})
    return LoginResponse(
        message="Login successful.",
        user_id=output.user_id,
        email=str(body.email),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesion",
)
async def logout(
    response: Response,
    current_user: TokenClaims = Depends(get_current_user),
) -> dict:
    """
    Cierra la sesion del usuario eliminando ambas cookies httponly.
    Requiere estar autenticado.
    """
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        key=settings.COOKIE_REFRESH_NAME,
        path="/api/v1/auth/refresh",
        httponly=True,
        samesite="lax",
    )
    logger.info("Logout realizado.", extra={"user_id": current_user.user_id})
    return {"message": "Logged out successfully."}


@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    summary="Renovar access token usando el refresh token",
    responses={
        401: {"description": "Refresh token invalido o expirado."},
    },
)
@limiter.limit("10/minute")
async def refresh(
    request: Request,
    response: Response,
    token_service: JwtTokenService = Depends(get_token_service),
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Genera un nuevo access token usando el refresh token de la cookie.
    El refresh token no se rota — solo se emite un nuevo access token.
    """
    from src.access_control.domain.ports.token_service import TokenInvalidError
    from jose import jwt as jose_jwt, JWTError

    refresh_token = request.cookies.get(settings.COOKIE_REFRESH_NAME)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found.",
        )

    try:
        payload = jose_jwt.decode(
            refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("token_type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type.",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = payload["sub"]

    # Recuperar datos del usuario para construir el nuevo access token
    user_repo = PostgresUserRepository(db)
    from uuid import UUID
    user = await user_repo.find_by_id(UUID(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    new_access_token = token_service.generate_token(
        TokenClaims(user_id=user_id, email=user.email, type=user.type)
    )
    response.set_cookie(value=new_access_token, **settings.cookie_config)
    logger.debug("Access token renovado via refresh.", extra={"user_id": user_id})
    return {"message": "Token refreshed successfully."}


@router.post(
    "/request-reset",
    status_code=status.HTTP_200_OK,
    summary="Solicitar reset de contrasena",
)
@limiter.limit("3/minute")
async def request_reset(
    request: Request,
    body: RequestResetRequest,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Inicia el flujo de reset de contrasena.

    Envia un email con un link de reset valido por 15 minutos.
    La respuesta es siempre generica para no revelar si el email existe.
    En development sin SMTP configurado, incluye el token en el response.
    """
    use_case = _build_request_reset_use_case(db)
    output = await use_case.execute(
        RequestPasswordResetInput(email=str(body.email))
    )
    result: dict = {"message": output.message}
    if output.reset_token is not None:
        result["reset_token"] = output.reset_token
    if output.dev_note is not None:
        result["dev_note"] = output.dev_note
    return result


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Confirmar reset de contrasena",
    responses={
        400: {"description": "Token invalido, expirado o usuario no encontrado."},
        422: {"description": "La nueva contrasena no cumple los requisitos."},
    },
)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Confirma el reset de contrasena usando el token recibido por email.
    El token tiene un TTL de 15 minutos y solo puede usarse una vez.
    """
    use_case = _build_reset_password_use_case(db)
    try:
        output = await use_case.execute(
            ResetPasswordInput(token=body.token, new_password=body.new_password)
        )
    except ResetPasswordError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )
    except PasswordTooWeakError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        )
    return {"message": output.message}


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Obtener datos del usuario autenticado",
    responses={
        401: {"description": "No autenticado o token invalido."},
    },
)
async def me(
    current_user: TokenClaims = Depends(get_current_user),
) -> MeResponse:
    """
    Retorna los datos del usuario actualmente autenticado.
    Lee los claims directamente del JWT — sin consultar la base de datos.
    """
    return MeResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        type=current_user.type,
    )


# ---------------------------------------------------------------------------
# Endpoint de desarrollo — solo disponible en environment != production
# ---------------------------------------------------------------------------

@router.post(
    "/token",
    response_model=TokenDevResponse,
    summary="[DEV ONLY] Obtener JWT en body para Swagger",
    include_in_schema=True,
)
@limiter.limit("5/minute")
async def token_dev(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_async_session),
    token_service: JwtTokenService = Depends(get_token_service),
) -> TokenDevResponse:
    """
    Retorna el JWT en el body del response para facilitar pruebas con Swagger UI.
    Este endpoint retorna HTTP 404 en production.
    No usar en el flujo de autenticacion de production.
    """
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    use_case = _build_authenticate_use_case(db, token_service)
    try:
        output = await use_case.execute(
            LoginInput(email=str(body.email), password=body.password)
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    return TokenDevResponse(access_token=output.access_token)
