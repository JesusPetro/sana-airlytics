# infra/python/

Dockerfile multi-stage compartido por los tres servicios Python del backend: `api`, `worker` e `ingest`.

## Por qué un solo Dockerfile con múltiples stages

El proyecto es un monorepo: todos los servicios Python comparten el mismo `pyproject.toml` raíz y el directorio `src/` (módulos de dominio compartidos). Tener un Dockerfile por servicio repetiría la instalación de dependencias en cada imagen. Con multi-stage:

1. **Stage `deps`** — instala todas las dependencias una sola vez desde el `pyproject.toml` raíz.
2. **Stage `api`**, **`worker`**, **`ingest`** — parten de `deps` y copian solo los archivos que cada uno necesita.

Esto garantiza que la capa de dependencias sea idéntica en todos los servicios y que Docker la cachee — si solo cambia código fuente, el rebuild es instantáneo.

## PYTHONPATH

```
PYTHONPATH=/app:/app/src
```

Necesario porque el código usa dos estilos de import:

| Import en código | Resuelve a |
|---|---|
| `from shared.infrastructure.logger import ...` | `/app/src/shared/` |
| `from data_ingestion.application import ...` | `/app/src/data_ingestion/` |
| `from src.access_control import ...` | `/app/src/access_control/` |

## Gestor de dependencias

Se usa **uv** (copiado desde su imagen oficial) en lugar de pip porque es significativamente más rápido en el paso de instalación de dependencias — relevante en cada rebuild de la imagen.

## entrypoint-api.sh

La API ejecuta `alembic upgrade head` antes de arrancar uvicorn. Esto garantiza que la base de datos siempre esté en el schema correcto sin necesidad de un servicio "migrator" separado. Solo aplica al stage `api`; worker e ingest no necesitan correr migraciones.

## Stages disponibles

| Target | Comando | Descripción |
|---|---|---|
| `api` | `uvicorn apps.api.main:app` | REST API + migraciones al arranque |
| `worker` | `python apps/worker/main.py` | Evaluación de alertas cada 5 min |
| `ingest` | `python apps/ingest/main.py` | Suscriptor MQTT para telemetría SEN66 |
