# Próximas tareas — Vista general

Este archivo consolida qué viene después de que `data_ingestion` funciona completamente en producción.
Las tareas detalladas siguen en sus archivos de origen — aquí solo se referencia y se prioriza.

---

## Estado de `data_ingestion`

**Completo y funcionando en producción.**
EMQX como broker cloud; credenciales en `.env`. El flujo sensor → MQTT → TimescaleDB está validado.

Pendientes menores (ver [`/TODO.md`](/TODO.md) en raíz del repo):
- Cache `_known_devices`: evaluar si necesita invalidación en runtime — **bajo riesgo para MVP**
- Migrar tests de integración a `async_session`
- `ON CONFLICT DO NOTHING` a nivel de observación individual en `TimescaleObservationRepository.save_batch`

---

## Migraciones pendientes

Ver [`todo-migrations.md`](todo-migrations.md) — sección "Migraciones pendientes":

- ~~**M-009** `observations` como hypertable~~ — **hecho** (migration `eb1658a8840c`)
- ~~**M-010** Compresión + continuous aggregate~~ — **hecho** (migration `eb1658a8840c`)
- **M-011** Política de retención (opcional)

---

## Arquitectura de despliegue — decisión tomada

El monorepo tiene **3 unidades de despliegue independientes**:

- `data_ingestion` — VM propia, su propio `pyproject.toml`
- `analytics` — VM propia, su propio `pyproject.toml`
- `access_control` + `device_management` + `apps/api` — se despliegan juntos, comparten el `pyproject.toml` raíz

`shared` es una dependencia común que los tres consumen. Se convierte en paquete instalable (ver sección abajo) para evitar copiar la carpeta entre VMs.

No es necesario mover carpetas — alcanza con agregar un `pyproject.toml` a cada uno y declarar los workspace members en el raíz con `uv workspaces`. El import path queda igual.

---

## `shared` — refactor de paquete

- [x] Convertir `shared` en paquete independiente (`src/shared/pyproject.toml`) — nombre `sana-shared`
- [x] Mover `ObservationModel` de `data_ingestion` a `shared/infrastructure/orm_models.py`
- [x] Extras opcionales definidos: `orm`, `auth`, `email`
- [x] Mover `LocationModel` / `HistoricalLocationModel` de `device_management` a `shared/infrastructure/orm_models.py`

---

## `device_management` — pendientes de infraestructura

Ver [`TODO-device.md`](TODO-device.md) sección 5:

- Decisión abierta: ¿quién escribe `historical_locations`? (`data_ingestion` o `device_management`)
- Bus de eventos: `pull_events()` existe pero se descarta — sin bus implementado
- **HTTP router** y **MQTT adapters** fuera de scope hasta tener API app

---

## Alembic — cómo correr migraciones

`env.py` **no carga `.env`** — el entorno lo inyecta el llamador:

```bash
# Con uv (recomendado)
uv run --env-file .env alembic upgrade head

# Directo, si DATABASE_URL ya está en el entorno del shell
alembic upgrade head
```

> El `load_dotenv()` fue eliminado de `migrations/env.py`. La variable `DATABASE_URL` debe
> estar disponible en el entorno del proceso antes de invocar Alembic.

---

## Orden sugerido de trabajo

1. ~~**M-009 hypertable**~~ — hecho
2. ~~**M-010 compresión + continuous aggregate**~~ — hecho
3. ~~**`shared` como paquete**~~ — hecho (`src/shared/pyproject.toml`)
4. **`device_management/infrastructure/`** — completar adaptadores
5. **`apps/api/main.py`** — FastAPI unificada
