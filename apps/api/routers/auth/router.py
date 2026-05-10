from __future__ import annotations

from shared.infrastructure.logger import get_logger
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from src.access_control.application.authenticate_user import (
    AuthenticateUserUseCase,
    AuthenticationError,
)
from src.access_control.application.delete_user_account import DeleteUserAccountUseCase
from src.access_control.application.dtos import (
    LoginInput,
    RegisterUserInput,
    RequestPasswordResetInput,
    ResetPasswordInput,
    UpdateUserProfileInput,
)
from src.access_control.application.get_user_profile import (
    GetUserProfileUseCase,
    UserNotFoundError,
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
from src.access_control.application.update_user_profile import UpdateUserProfileUseCase
from src.access_control.domain.ports.repositories import UserRepository
from src.access_control.domain.ports.token_service import (
    TokenClaims,
    TokenInvalidError,
    TokenService,
)
from ...config.settings import settings
from ...dependencies.auth import get_current_user, get_token_service
from ...dependencies.limiter import limiter
from ...dependencies.repositories import get_user_repository
from ...dependencies.use_cases import (
    get_authenticate_use_case,
    get_delete_user_account_use_case,
    get_register_use_case,
    get_request_reset_use_case,
    get_reset_password_use_case,
    get_update_user_profile_use_case,
    get_user_profile_use_case,
)
from .schemas import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
    RequestResetRequest,
    ResetPasswordRequest,
    TokenDevResponse,
    UpdateProfileRequest,
    UserProfileResponse,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

_RegisterUC = Annotated[RegisterUserUseCase, Depends(get_register_use_case)]
_AuthenticateUC = Annotated[AuthenticateUserUseCase, Depends(get_authenticate_use_case)]
_ResetPasswordUC = Annotated[ResetPasswordUseCase, Depends(get_reset_password_use_case)]
_GetProfileUC = Annotated[GetUserProfileUseCase, Depends(get_user_profile_use_case)]
_UpdateProfileUC = Annotated[UpdateUserProfileUseCase, Depends(get_update_user_profile_use_case)]
_DeleteAccountUC = Annotated[DeleteUserAccountUseCase, Depends(get_delete_user_account_use_case)]
_RequestResetUC = Annotated[RequestPasswordResetUseCase, Depends(get_request_reset_use_case)]
_TokenSvc = Annotated[TokenService, Depends(get_token_service)]
_UserRepo = Annotated[UserRepository, Depends(get_user_repository)]
_CurrentUser = Annotated[TokenClaims, Depends(get_current_user)]



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
    use_case: _RegisterUC,
) -> RegisterResponse:
    """Registra un nuevo usuario; el email debe ser unico en el sistema."""
    cmd = RegisterUserInput(
        email=str(body.email),
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
        middle_name=body.middle_name,
        phone=body.phone,
        address=body.address,
        type=body.type,
    )
    try:
        output = await use_case.execute(cmd)
    except EmailAlreadyRegisteredError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        ) from exc

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
    use_case: _AuthenticateUC,
) -> LoginResponse:
    """Autentica al usuario y establece cookies httponly; el JWT no se expone en el body."""
    try:
        output = await use_case.execute(LoginInput(email=str(body.email), password=body.password))
    except AuthenticationError as exc:
        logger.warning("Intento de login fallido.", extra={"email": str(body.email)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        ) from exc

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
    current_user: _CurrentUser,
) -> dict:
    """Elimina ambas cookies httponly cerrando la sesion."""
    response.delete_cookie(key=settings.COOKIE_NAME, path="/", httponly=True, samesite="lax")
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
    token_service: _TokenSvc,
    user_repo: _UserRepo,
) -> dict:
    """Genera un nuevo access token usando el refresh token de la cookie."""
    refresh_token = request.cookies.get(settings.COOKIE_REFRESH_NAME)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found.",
        )

    try:
        user_id = token_service.validate_refresh_token(refresh_token)
    except TokenInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        ) from exc

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
    use_case: _RequestResetUC,
) -> dict:
    """Envia el email de reset; la respuesta es generica para no revelar si el email existe."""
    output = await use_case.execute(RequestPasswordResetInput(email=str(body.email)))
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
    use_case: _ResetPasswordUC,
) -> dict:
    """Confirma el reset de contrasena usando el token recibido por email."""
    try:
        output = await use_case.execute(
            ResetPasswordInput(token=body.token, new_password=body.new_password)
        )
    except ResetPasswordError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return {"message": output.message}


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Obtener datos del usuario autenticado",
    responses={
        401: {"description": "No autenticado o token invalido."},
    },
)
async def me(current_user: _CurrentUser) -> MeResponse:
    """Retorna claims del usuario autenticado; lee del JWT sin consultar la base de datos."""
    return MeResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        type=current_user.type,
    )


@router.post(
    "/token",
    response_model=TokenDevResponse,
    summary="[DEV ONLY] Obtener JWT en body para Swagger",
    include_in_schema=settings.is_development,
)
@limiter.limit("5/minute")
async def token_dev(
    request: Request,
    body: LoginRequest,
    use_case: _AuthenticateUC,
) -> TokenDevResponse:
    """Retorna el JWT en el body para Swagger; responde 404 en production."""
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    try:
        output = await use_case.execute(
            LoginInput(email=str(body.email), password=body.password)
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        ) from exc
    return TokenDevResponse(access_token=output.access_token)


@router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="Obtener perfil completo del usuario autenticado",
    responses={
        401: {"description": "No autenticado o token invalido."},
        404: {"description": "Usuario no encontrado o inactivo."},
    },
)
async def get_profile(
    current_user: _CurrentUser,
    use_case: _GetProfileUC,
) -> UserProfileResponse:
    """Retorna los datos completos del perfil leyendo desde la BD, no del JWT."""
    try:
        output = await use_case.execute(current_user.user_id)
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        ) from exc
    return UserProfileResponse(
        user_id=output.user_id,
        email=output.email,
        first_name=output.first_name,
        last_name=output.last_name,
        middle_name=output.middle_name,
        phone=output.phone,
        address=output.address,
        type=output.type,
        is_active=output.is_active,
    )


@router.patch(
    "/profile",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Actualizar perfil del usuario autenticado",
    responses={
        401: {"description": "No autenticado o token invalido."},
        404: {"description": "Usuario no encontrado o inactivo."},
    },
)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: _CurrentUser,
    use_case: _UpdateProfileUC,
) -> None:
    """Actualiza los campos editables del perfil. El email no es modificable."""
    cmd = UpdateUserProfileInput(
        user_id=current_user.user_id,
        first_name=body.first_name,
        last_name=body.last_name,
        middle_name=body.middle_name,
        phone=body.phone,
        address=body.address,
    )
    try:
        await use_case.execute(cmd)
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        ) from exc


@router.delete(
    "/account",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cuenta del usuario autenticado (soft delete)",
    responses={
        401: {"description": "No autenticado o token invalido."},
        404: {"description": "Usuario no encontrado o ya inactivo."},
    },
)
async def delete_account(
    current_user: _CurrentUser,
    use_case: _DeleteAccountUC,
) -> None:
    """Desactiva la cuenta; el registro permanece en BD (soft delete)."""
    try:
        await use_case.execute(current_user.user_id)
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        ) from exc
