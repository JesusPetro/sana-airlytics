# TODO — Bounded Context: device_management

> Contexto: `device` es sinónimo de `sensor` — la tabla `sensors` en BD es el device.
> El BC se construye en capas: domain → application → infrastructure → tests.
> FastAPI (router HTTP) queda fuera de scope por ahora.
> Credenciales MQTT: configuración manual fuera del sistema — no hay provisioning automatizado.

---

## Estado actual

- `src/device_management/infrastructure/orm_models.py` — `SensorModel`, `LocationModel`, `HistoricalLocationModel` ya existen.
- `src/device_management/domain/device_status.py` — ✅ completo
- `src/device_management/domain/device_config.py` — ✅ completo
- `src/device_management/domain/device_location.py` — ✅ completo (sin `site_type`)
- `src/device_management/domain/site_type.py` — ✅ completo (`SiteType` enum: INDOOR, OUTDOOR, MOBILE)
- `src/device_management/domain/device_limits.py` — ✅ completo
- `src/device_management/domain/device_events.py` — ✅ completo
- `src/device_management/domain/device.py` — ✅ completo (incluye `site_type` como atributo propio; `last_seen` eliminado de `reconstitute()` — no se persiste)
- `src/device_management/domain/ports/repositories.py` — ✅ completo
- `src/device_management/domain/ports/publishers.py` — ✅ completo (solo `CommandPublisher` — `DeviceEventPublisher` descartado hasta tener bus de eventos)
- `src/device_management/application/dtos.py` — ✅ completo

---

## 1. Domain

### 1.1 Value objects

- [x] `src/device_management/domain/device_status.py`
  - Enum: `PENDING`, `ACTIVE`, `INACTIVE`, `MAINTENANCE`

- [x] `src/device_management/domain/device_config.py`
  - `@dataclass(frozen=True)` con `sampling_interval_seconds: int`, `transmission_interval_seconds: int`
  - `__post_init__`: `sampling >= 5`, `transmission >= sampling`
  - `@property keepalive_seconds` → `transmission_interval_seconds // 2`

- [x] `src/device_management/domain/device_location.py`
  - `@dataclass(frozen=True)` con `latitude: float`, `longitude: float`, `elevation: float | None`
  - Sin `site_type` — movido al agregado Device

- [x] `src/device_management/domain/site_type.py`
  - `SiteType(Enum)`: `INDOOR`, `OUTDOOR`, `MOBILE`
  - Label de uso del device, independiente de su ubicacion geografica

### 1.2 Errores de dominio

- [x] `src/device_management/domain/errors.py`
  - `DeviceNotFoundError`
  - `DeviceAlreadyExistsError`

### 1.3 Eventos de dominio

- [x] `src/device_management/domain/device_events.py`
  - `DeviceRegisteredEvent(device_id, workspace_id, code, model)`
  - `DeviceActivatedEvent(device_id)`
  - `DeviceOfflineEvent(device_id, last_seen)`
  - `DeviceConfigUpdatedEvent(device_id, new_sampling_interval, new_transmission_interval)`
  - Todos heredan de `shared.domain.domain_event.DomainEvent`

### 1.4 Agregado raíz

- [x] `src/device_management/domain/device.py`
  - Hereda de `shared.domain.aggregate_root.AggregateRoot`
  - Atributos: `_id`, `_code`, `_name`, `_model`, `_workspace_id`, `_status`, `_site_type`, `_config`, `_location`, `_last_seen`, `_created_at`, `_deactivated_at`
  - `__init__`: valida code (no vacío, max 64 chars), normaliza a uppercase, valida name y model no vacíos — emite `DeviceRegisteredEvent`
  - `reconstitute()`: reconstruye desde persistencia sin emitir eventos
  - Operaciones: `activate()`, `mark_offline()`, `deactivate()`, `update_config(new_config)`, `record_heartbeat(timestamp)`

### 1.5 Puertos (Protocols)

- [x] `src/device_management/domain/ports/repositories.py`
  - `DeviceRepository(Protocol)`: `save`, `find_by_id`, `find_by_code`, `find_by_workspace`

- [x] `src/device_management/domain/ports/publishers.py`
  - `CommandPublisher(Protocol)`: `send_config_update` — publica en `sana/{device_id}/config` con retain=True

---

## 2. Application

### 2.1 DTOs

- [x] `src/device_management/application/dtos.py`
  - `RegisterDeviceInput(code, name, model, workspace_id, site_type?, sampling_interval_seconds=30, transmission_interval_seconds=60)`
  - `RegisterDeviceOutput(device_id, code)`
  - `UpdateDeviceConfigInput(device_id, sampling_interval_seconds, transmission_interval_seconds)`
  - `DeviceStatusOutput(device_id, code, name, model, status, sampling_interval_seconds, transmission_interval_seconds, keepalive_seconds, last_seen, deactivated_at, site_type?, latitude?, longitude?, elevation?)`

### 2.2 Casos de uso

- [x] `src/device_management/application/register_device.py` — `RegisterDeviceUseCase`
- [x] `src/device_management/application/activate_device.py` — `ActivateDeviceUseCase`
- [x] `src/device_management/application/update_device_config.py` — `UpdateDeviceConfigUseCase`
- [x] `src/device_management/application/mark_device_offline.py` — `MarkDeviceOfflineUseCase`
- [x] `src/device_management/application/record_heartbeat.py` — `RecordHeartbeatUseCase`
- [x] `src/device_management/application/get_device_status.py` — `GetDeviceStatusUseCase`

---

## 3. Infrastructure

### 3.1 ORM (revisar / ampliar)

- [x] `src/device_management/infrastructure/orm_models.py` — **ampliar el existente**
  - `SensorModel` ya tiene: `id`, `code`, `name`, `model`, `site_type`, `status`, `workspace_id`, `created_at`, `updated_at`, `deleted_at`
  - Agregado: `deactivated_at: DateTime | None`, `sampling_interval_seconds: int (default 60)`, `transmission_interval_seconds: int (default 300)`
  - `last_seen` descartado — se deriva de `observations` para evitar hotspot de escritura
  - `LocationModel` y `HistoricalLocationModel` ya existen

### 3.2 Repositorio

- [x] `src/device_management/infrastructure/postgres_device_repo.py` — `PostgresDeviceRepository`
  - Implementa `DeviceRepository`
  - `save()`: upsert por id con `on_conflict_do_update` usando `excluded`; upsert separado para `LocationModel` si hay location
  - `find_by_id()`: SELECT + LEFT JOIN locations, reconstruye `Device` via `Device.reconstitute()`
  - `find_by_code()`: SELECT por `code.upper()` + LEFT JOIN locations
  - `find_by_workspace()`: SELECT WHERE `workspace_id` AND `deleted_at IS NULL` + LEFT JOIN locations
  - `_to_domain()`: método privado compartido por los 3 métodos de lectura

### 3.3 Migración

- [ ] Nueva migración Alembic para columnas faltantes en `sensors`
  - Agregar: `deactivated_at TIMESTAMPTZ`, `sampling_interval_seconds INTEGER NOT NULL DEFAULT 60`, `transmission_interval_seconds INTEGER NOT NULL DEFAULT 300`
  - Generar con: `uv run alembic revision --autogenerate -m "add device config columns to sensors"`

---

## 4. Tests

### 4.1 Unit — Domain

- [x] `tests/unit/device_management/domain/test_device_config.py`
  - Validaciones `__post_init__`: `sampling < 5`, `transmission < sampling`
  - `keepalive_seconds` correcto (`transmission // 2`)

- [x] `tests/unit/device_management/domain/test_device.py`
  - Normalización a uppercase del code
  - Invariantes: code vacío, code > 64 chars, model vacío, name vacío
  - Ciclo de vida: `PENDING → ACTIVE → INACTIVE → ACTIVE`
  - `activate()` idempotente si ya `ACTIVE`
  - `record_heartbeat()` reactiva desde `INACTIVE`
  - `pull_events()` vacía la lista tras la llamada

### 4.2 Unit — Application

- [x] `tests/unit/device_management/application/test_register_device.py`
- [x] `tests/unit/device_management/application/test_activate_device.py`
- [x] `tests/unit/device_management/application/test_mark_device_offline.py`
- [x] `tests/unit/device_management/application/test_record_heartbeat.py`
- [x] `tests/unit/device_management/application/test_update_device_config.py`
- [x] `tests/unit/device_management/application/test_get_device_status.py`

### 4.3 Integration — Infrastructure

- [x] `tests/integration/device_management/test_postgres_device_repo.py`
  - Nuevas columnas `sampling_interval_seconds`, `transmission_interval_seconds`, `deactivated_at` persisten correctamente
  - Server defaults aplicados cuando no se pasan valores
  - `find_by_code` solo matchea uppercase
  - `find_by_workspace` excluye soft-deleted
  - Location roundtrip (con y sin location)

---

## 5. Pendientes / Decisiones abiertas

- [ ] **Publicación de eventos de dominio**: `pull_events()` existe pero no hay bus implementado — los casos de uso lo llaman y descartan por ahora.
- [x] **`HistoricalLocationModel`**: escribe `data_ingestion` via `PostgresLocationUpdater` — ambos modelos movidos a `shared/infrastructure/orm_models.py`
