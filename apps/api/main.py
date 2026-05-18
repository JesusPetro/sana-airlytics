from __future__ import annotations

from shared.infrastructure.logger import get_logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.access_control.application.errors import WeakPasswordError
from src.access_control.infrastructure.jwt_token_service import JwtTokenService

from .config.settings import settings
from .dependencies.limiter import limiter as _limiter
from .middleware.refresh_token import RefreshTokenMiddleware
from .middleware.security_headers import SecurityHeadersMiddleware
from .routers.analytics.router import router as analytics_router
from .routers.auth.router import router as auth_router
from .routers.devices.router import router as devices_router
from .routers.workspaces.router import router as workspaces_router

logger = get_logger(__name__)

_TAGS_METADATA = [
    {
        "name": "Auth",
        "description": (
            "Autenticacion y gestion de sesion. "
            "Los tokens se almacenan en cookies httponly — "
            "el cliente nunca recibe el JWT directamente en production."
        ),
    },
    {
        "name": "Workspaces",
        "description": "Gestion de workspaces y colaboradores con control de acceso RBAC.",
    },
    {
        "name": "Devices",
        "description": (
            "Registro y gestion de devices fisicos SANA. "
            "Flujo: POST /devices (PENDING) -> POST /devices/{id}/claim (ACTIVE)."
        ),
    },
    {
        "name": "Analytics",
        "description": (
            "Consultas de series temporales, agregaciones, geovisualizacion, "
            "anotaciones, alertas y zonas de calidad del aire."
        ),
    },
]


def create_app() -> FastAPI:
    """
    Factory que construye la instancia FastAPI con todos sus middlewares y routers.
    Usar el patron factory facilita la creacion de instancias de test.
    """
    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
        openapi_tags=_TAGS_METADATA,
    )

    # --- Token service (singleton compartido con middleware y DI) ---
    token_service = JwtTokenService(
        secret_key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
        access_expire_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_expire_days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS,
        reset_expire_minutes=settings.JWT_RESET_TOKEN_EXPIRE_MINUTES,
    )
    app.state.token_service = token_service

    # --- Rate limiting ---
    app.state.limiter = _limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # --- CORS (debe ir antes de los custom middlewares) ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Security headers ---
    app.add_middleware(SecurityHeadersMiddleware)

    # --- Renovacion automatica de cookie ---
    app.add_middleware(RefreshTokenMiddleware, token_service=token_service)

    # --- Routers ---
    app.include_router(auth_router)
    app.include_router(workspaces_router)
    app.include_router(devices_router)
    app.include_router(analytics_router)

    # --- Exception handlers ---
    @app.exception_handler(WeakPasswordError)
    async def weak_password_handler(_: Request, exc: WeakPasswordError) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    # --- Swagger con soporte Bearer para development ---
    if settings.is_development:
        _configure_swagger_bearer(app)

    logger.info(
        "API iniciada.",
        extra={"environment": settings.ENVIRONMENT, "version": settings.API_VERSION},
    )
    return app


def _configure_swagger_bearer(app: FastAPI) -> None:
    """
    Agrega el esquema de seguridad Bearer a Swagger UI.
    Solo se activa en development para facilitar el testing manual.
    """

    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description or "",
            routes=app.routes,
        )
        schema.setdefault("components", {}).setdefault("securitySchemes", {})[
            "HTTPBearer"
        ] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": (
                "Solo para development/Swagger. "
                "Usar POST /api/v1/auth/token para obtener el token."
            ),
        }
        app.openapi_schema = schema
        return schema

    app.openapi = custom_openapi  # type: ignore[method-assign]


app = create_app()


@app.get("/api/health", tags=["Health"])
async def health() -> dict:
    """
    Verifica que la API esta corriendo correctamente.
    Usado por monitoreo de contenedores y load balancers.
    """
    return {
        "status": "healthy",
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
    }
