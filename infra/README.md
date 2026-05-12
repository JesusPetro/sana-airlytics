# infra/

Contiene las definiciones de infraestructura de contenedores del proyecto. Cada subdirectorio agrupa la configuración de un componente de la plataforma.

```
infra/
├── db/        Base de datos PostgreSQL + TimescaleDB + PostGIS
├── nginx/     Reverse proxy — único punto de entrada al sistema
└── python/    Dockerfile multi-stage compartido por api, worker e ingest
```

## Arquitectura de red

Todos los servicios viven en la red interna `sana-net`. El único puerto expuesto al exterior es el **80 (nginx)**. El resto se comunica internamente por nombre de servicio (DNS interno de Docker).

```
Internet / Browser
       │
    [nginx:80]          ← único punto de entrada
    /        \
[api:8000]  [web:3000]
      │
   [db:5432]  ←── también accedido por worker e ingest
      
[worker]  (sin puerto expuesto)
[ingest]  (sin puerto expuesto)
```

## Por qué esta separación

| Servicio | Tipo | Decisión |
|---|---|---|
| `api` | HTTP server | Expuesto via nginx en `/api/` |
| `web` | HTTP server | Expuesto via nginx en `/` |
| `worker` | Proceso batch | Solo necesita DB, sin puerto |
| `ingest` | Suscriptor MQTT | Solo necesita DB y broker externo, sin puerto |
| `nginx` | Reverse proxy | Único puerto 80 al host |
| `db` | Base de datos | Solo red interna (puerto 5432 para dev desde host) |
