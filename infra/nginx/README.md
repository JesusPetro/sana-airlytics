# infra/nginx/

Reverse proxy basado en **nginx:alpine** que actúa como único punto de entrada al sistema.

## Por qué un reverse proxy

Sin nginx, el frontend y el backend expondrían puertos distintos al host (ej. 3000 y 8000). Eso significa que el browser haría peticiones a dos orígenes diferentes, lo que complica CORS y la configuración de cookies. Con nginx:

- **Un solo puerto (80)** para todo el tráfico.
- El frontend llama a `/api/...` en el mismo origen — sin problemas de CORS.
- Los servicios internos (`worker`, `ingest`, `db`) permanecen completamente aislados de la red exterior.
- Si en el futuro se agrega SSL/TLS, se configura únicamente aquí sin tocar los servicios.

## Enrutamiento

| Path de entrada | Destino interno |
|---|---|
| `localhost/api/*` | `api:8000/*` (se elimina el prefijo `/api`) |
| `localhost/*` | `web:3000/*` |

El strip del prefijo `/api/` se logra con `proxy_pass http://api_backend/;` — la barra final en la URL de destino le indica a nginx que reemplace el `location` completo.

## Archivos

- `nginx.conf` — configuración del servidor virtual. Se monta como volumen read-only en el contenedor.

## SSL (futuro)

Para agregar HTTPS se necesita:
1. Un certificado (Let's Encrypt con `certbot` o un certificado propio).
2. Agregar un bloque `server` en puerto 443 con `ssl_certificate` y `ssl_certificate_key`.
3. Redirigir el puerto 80 a 443.

No se implementa ahora porque el proyecto corre en red local / laboratorio sin dominio registrado.
