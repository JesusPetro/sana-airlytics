# ── Base ──────────────────────────────────────────────────────────────────────
FROM python:3.14-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app:/app/src

WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# ── Dependencias (compartido por todos los stages) ────────────────────────────
FROM base AS deps

COPY pyproject.toml .
RUN uv pip install --system --no-cache .

# ── API ───────────────────────────────────────────────────────────────────────
FROM deps AS api

COPY config/ config/
COPY src/ src/
COPY migrations/ migrations/
COPY alembic.ini .
COPY apps/api/ apps/api/
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["sh", "-c", "alembic upgrade head && uvicorn apps.api.main:app --host 0.0.0.0 --port 8000"]

# ── Worker ────────────────────────────────────────────────────────────────────
FROM deps AS worker

COPY config/ config/
COPY src/ src/
COPY apps/worker/ apps/worker/

CMD ["python", "apps/worker/main.py"]

# ── Ingest ────────────────────────────────────────────────────────────────────
FROM deps AS ingest

COPY config/ config/
COPY src/ src/
COPY apps/ingest/ apps/ingest/

CMD ["python", "apps/ingest/main.py"]
