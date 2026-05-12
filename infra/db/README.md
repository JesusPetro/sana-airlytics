# infra/db/

Imagen de base de datos construida sobre **TimescaleDB + PostgreSQL 17** con extensión **PostGIS** instalada.

## Por qué esta imagen personalizada

La imagen oficial `timescale/timescaledb:latest-pg17` no incluye PostGIS. El Dockerfile instala `postgis` vía `apk` y crea los symlinks necesarios para que PostgreSQL encuentre las librerías de la extensión en las rutas correctas de la imagen Alpine.

## Extensiones habilitadas

| Extensión | Propósito |
|---|---|
| `timescaledb` | Almacenamiento y consultas eficientes de series temporales (mediciones de sensores) |
| `postgis` | Datos y consultas geoespaciales (ubicación de dispositivos, zonas de calidad del aire) |

## Persistencia

Los datos se guardan en el volumen Docker `pgdata` declarado en `docker-compose.yml`. El volumen sobrevive reinicios y recreaciones del contenedor — solo se pierde si se elimina explícitamente con `docker volume rm`.

## Conexión

Dentro de la red `sana-net`, los servicios se conectan con:
```
postgresql+asyncpg://sana:sana@db:5432/sana_db
```

Desde el host (para herramientas como DBeaver o psql):
```
host: localhost  port: 5432  user: sana  password: sana  db: sana_db
```
