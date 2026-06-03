# sana-airlytics

Air quality analytics for Sensirion SEN66.

## Requirements

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)
- Docker

## Setup

**1 — Install dependencies**
```bash
uv sync --group dev
```

**2 — Create `.env`**
```bash
DATABASE_URL=postgresql+psycopg2://sana:sana@localhost:5432/sana_db
```

**3 — Start the database**
```bash
docker compose up -d
```

**4 — Run migrations**
```bash
uv run --env-file .env alembic upgrade head
```

## Tests

```bash
uv run --env-file .env pytest tests/integration/ -v
```
