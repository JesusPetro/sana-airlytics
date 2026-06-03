# Manual de Replicación — Software SANA Airlytics

**Configuración, despliegue y puesta en marcha de la plataforma**

*Sensor-based Air Quality and Networked Analytics*

J.D. Petro-Ramos · D. Agamez-Escobar · E.D. Campos-Santos · Y. Pérez-Jiménez

Proyecto de grado — Universidad Tecnológica de Bolívar

---

## Índice

1. [Aclaraciones iniciales](#1-aclaraciones-iniciales)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Prerrequisitos](#3-prerrequisitos)
4. [Obtener el repositorio](#4-obtener-el-repositorio)
5. [Entorno de desarrollo local](#5-entorno-de-desarrollo-local)
6. [Despliegue en producción — 4 Droplets](#6-despliegue-en-producción--4-droplets)
   - [Fase 1 — Infraestructura en DigitalOcean](#fase-1--infraestructura-en-digitalocean)
   - [Fase 2 — Setup base en cada Droplet](#fase-2--setup-base-en-cada-droplet)
   - [Fase 3 — Archivos de configuración](#fase-3--archivos-de-configuración)
   - [Fase 4 — Certificado SSL](#fase-4--certificado-ssl)
   - [Fase 5 — Deploy en orden](#fase-5--deploy-en-orden)
   - [Fase 6 — Configurar Grafana](#fase-6--configurar-grafana)
7. [Verificación del sistema completo](#7-verificación-del-sistema-completo)
8. [Actualizaciones futuras](#8-actualizaciones-futuras)
- [Apéndice A — Variables de entorno](#apéndice-a--variables-de-entorno)
- [Apéndice B — Puertos y red](#apéndice-b--puertos-y-red)
- [Apéndice C — Solución de problemas comunes](#apéndice-c--solución-de-problemas-comunes)

---

## 1. Aclaraciones iniciales

### Alcance del manual

Este manual cubre la replicación completa del software de SANA Airlytics: entorno de desarrollo local, despliegue en producción sobre cuatro servidores en la nube y verificación del sistema. No cubre la configuración del firmware del nodo físico; ese proceso se documenta en el Manual de Replicación del Firmware.

### Objetivo

Que cualquier persona con conocimientos básicos de terminal y acceso a los servicios externos requeridos pueda replicar el sistema completo siguiendo estos pasos en orden.

### Antes de comenzar

Este manual asume:

- Conocimiento básico de terminal (Linux/macOS o PowerShell en Windows).
- Acceso a las cuentas de servicios externos descritas en la sección 3.
- Git y Docker instalados localmente.

> **Importante:** Ningún archivo `.env`, credencial, certificado TLS ni clave secreta debe subirse al repositorio. Todos los archivos de configuración con información sensible están incluidos en `.gitignore`.

---

## 2. Stack tecnológico

Componentes principales utilizados en la plataforma SANA Airlytics.

| Componente | Tecnología | Función |
|---|---|---|
| API y lógica de negocio | Python 3.12 + FastAPI | Servidor REST asíncrono. Autenticación, RBAC y endpoints de datos. |
| Plataforma web (HMI) | Next.js 15 + React | Dashboard web del operador. Renderizado híbrido SSR/CSR. |
| Base de datos | PostgreSQL 18 + TimescaleDB + PostGIS | Series temporales, consultas históricas y análisis geoespacial. |
| Mensajería IoT | EMQX Cloud | Broker MQTT con TLS. Recibe telemetría de los nodos físicos. |
| Notificaciones | Resend | Correo electrónico transaccional para alertas y recuperación de contraseña. |
| Contenedorización | Docker + Docker Compose | Empaquetado y orquestación de todos los servicios. |
| Proxy inverso | Nginx | Punto de entrada único con TLS. Enrutamiento por path. |
| Certificados TLS | Certbot (Let's Encrypt) | Certificados SSL/TLS gratuitos con renovación automática. |
| Observabilidad | Prometheus + Grafana | Métricas de infraestructura y contenedores. Monitoreo centralizado. |
| Gestión de dependencias Python | uv | Instalación y sincronización de entorno virtual. |
| Migraciones de base de datos | Alembic | Versionado y aplicación de cambios de esquema. |
| Lenguaje firmware (referencia) | C++ con Arduino Framework | Nodo físico (ver Manual de Firmware). |

---

## 3. Prerrequisitos

### 3.1 Cuentas de servicios externos

Antes de iniciar el despliegue, es necesario tener acceso activo a los siguientes servicios:

| Servicio | Para qué se usa | URL |
|---|---|---|
| **DigitalOcean** | Infraestructura cloud: 4 Droplets + VPC + Floating IP | https://digitalocean.com |
| **EMQX Cloud** | Broker MQTT para recibir telemetría de los nodos físicos | https://cloud.emqx.com |
| **Resend** | Envío de correos de alerta y recuperación de contraseña | https://resend.com |
| **Proveedor de dominio** | Registro DNS para apuntar el dominio a la Floating IP | (el que el equipo use) |

> **Nota:** Los planes gratuitos de EMQX Cloud y Resend son suficientes para el alcance del prototipo.

### 3.2 Herramientas locales

Instalar en la máquina de desarrollo antes de continuar:

**Git**

```bash
# Verificar instalación
git --version
# Resultado esperado: git version 2.x.x
```

**Docker y Docker Compose**

```bash
# Verificar instalación
docker --version
docker compose version
# Resultado esperado:
# Docker version 26.x.x
# Docker Compose version v2.x.x
```

> **Importante:** En Windows, usar Docker Desktop con WSL2 habilitado. En Linux, agregar el usuario al grupo `docker` para evitar usar `sudo`:
> ```bash
> sudo usermod -aG docker $USER
> # Cerrar sesión y volver a iniciarla para aplicar el cambio
> ```

**uv** (gestor de dependencias Python)

```bash
# Instalar uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# En Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verificar instalación
uv --version
# Resultado esperado: uv 0.x.x
```

**Node.js 20 o superior** (para el frontend)

```bash
# Verificar instalación
node --version
npm --version
# Resultado esperado: v20.x.x / 10.x.x
```

### 3.3 Información necesaria antes de comenzar

Antes de iniciar el despliegue en producción, tener a mano:

- [ ] IPs privadas de los 4 Droplets en la VPC (se obtienen en la Fase 1).
- [ ] Host, puerto y certificado CA del broker EMQX Cloud.
- [ ] API key de Resend con dominio verificado.
- [ ] Nombre de dominio con acceso a la configuración DNS.
- [ ] Dirección de correo electrónico para el certificado Let's Encrypt.

---

## 4. Obtener el repositorio

Hay dos formas de obtener el código fuente de la plataforma.

### Opción A — Clonar con Git (recomendada)

```bash
# En la terminal, en la carpeta donde se desea guardar el proyecto
git clone https://github.com/JesusPetro/sana-airlytics.git
cd sana-airlytics
```

**Resultado esperado:** una carpeta `sana-airlytics/` con el código fuente completo del repositorio.

### Opción B — Descargar ZIP

1. Ir al repositorio en GitHub.
2. Hacer clic en **Code**.
3. Seleccionar **Download ZIP**.
4. Extraer el archivo en la carpeta de preferencia.
5. Abrir la carpeta extraída en el editor.

> **Recomendación:** La Opción A es preferible porque facilita recibir actualizaciones con `git pull` sin necesidad de descargar el repositorio nuevamente.

---

## 5. Entorno de desarrollo local

Esta sección permite correr el sistema completo en la máquina local antes de desplegar en producción. Es el paso recomendado para verificar que todo funciona correctamente con la configuración específica del entorno.

### 5.1 Levantar la base de datos local

El repositorio incluye un `docker-compose.yml` de desarrollo que levanta PostgreSQL con TimescaleDB y PostGIS localmente.

```bash
# Desde la raíz del repositorio
docker compose up db -d

# Verificar que el contenedor está saludable
docker compose ps
# Resultado esperado: db   running (healthy)
```

### 5.2 Configurar variables de entorno locales

El repositorio incluye un archivo `.env.example` con todas las variables necesarias y sus descripciones.

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Abrir el archivo `.env` con cualquier editor de texto y completar los valores. Ver el [Apéndice A](#apéndice-a--variables-de-entorno) para la descripción completa de cada variable.

Ejemplo de valores mínimos para desarrollo local:

```env
DATABASE_URL=postgresql+asyncpg://sana:sana_dev_password@localhost:5432/sana_db
SECRET_KEY=clave-aleatoria-de-al-menos-32-caracteres
ALLOWED_ORIGINS=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Seguridad:** El archivo `.env` contiene información sensible. Ya está incluido en `.gitignore` y no debe subirse al repositorio ni compartirse.

### 5.3 Instalar dependencias Python

```bash
# Crear entorno virtual e instalar dependencias
uv sync

# Verificar instalación
uv run python --version
# Resultado esperado: Python 3.12.x
```

### 5.4 Correr las migraciones de base de datos

```bash
uv run alembic upgrade head
```

**Resultado esperado:**

```
INFO  [alembic.runtime.migration] Running upgrade  -> <revision>, initial schema
INFO  [alembic.runtime.migration] Running upgrade <revision> -> <revision>, ...
```

Si el comando falla con un error de conexión, verificar que el contenedor de la base de datos esté corriendo (`docker compose ps`) y que `DATABASE_URL` en el `.env` sea correcto.

### 5.5 Levantar la API

```bash
uv run uvicorn apps.api.main:app --reload --port 8000
```

**Verificar que responde:**

```bash
curl http://localhost:8000/api/health
# Resultado esperado: {"status": "ok"}
```

O abrir en el navegador: `http://localhost:8000/api/docs` para ver la documentación interactiva de la API.

### 5.6 Levantar el frontend

En una nueva terminal:

```bash
cd apps/web
npm install
npm run dev
```

**Resultado esperado:**

```
▲ Next.js 15.x.x
- Local: http://localhost:3000
```

Abrir `http://localhost:3000` en el navegador para acceder al dashboard.

### 5.7 Levantar el worker de alertas

En una nueva terminal:

```bash
uv run python -m apps.worker.main
```

**Resultado esperado:**

```
{"level": "info", "message": "worker iniciado", "cycle_seconds": 300}
```

El worker evalúa las reglas de alerta cada 5 minutos. Si no hay reglas configuradas, el ciclo se ejecuta silenciosamente.

---

## 6. Despliegue en producción — 4 Droplets

La plataforma se despliega sobre cuatro servidores virtuales (Droplets) en DigitalOcean, interconectados por una red privada VPC. La arquitectura completa es:

```
Dispositivos IoT                        Usuarios
      │ MQTT/TLS (8883)                     │ HTTPS (443)
      ▼                                     ▼
┌─────────────────┐             ┌───────────────────────┐
│   Droplet C     │             │      Droplet A         │
│   Ingest        │──── VPC ───►│   Nginx + Next.js      │
│   EMQX suscript.│             │   Certbot              │
└────────┬────────┘             └───────────┬────────────┘
         │ VPC                              │ VPC
         │                  ┌──────────────▼─────────────┐
         │                  │         Droplet B            │
         └─────────────────►│   FastAPI      :8000         │
                            │   Worker                     │
                            │   Prometheus   :9090         │
                            │   Grafana      :3001         │
                            └──────────────┬──────────────┘
                                           │ VPC
                            ┌─────────────▼──────────────┐
                            │         Droplet D            │
                            │   TimescaleDB + PostGIS      │
                            │   Puerto 5432 solo VPC       │
                            └─────────────────────────────┘
```

| Droplet | Rol | Servicios | Tamaño | Costo aprox. |
|---|---|---|---|---|
| A — Frontend | Único punto de entrada público | Nginx, Next.js, Certbot, node-exporter, cAdvisor | s-1vcpu-2gb | $12/mes |
| B — Backend | Lógica de negocio y observabilidad | FastAPI, Worker, Prometheus, Grafana, node-exporter, cAdvisor | s-2vcpu-4gb | $24/mes |
| C — Ingest | Recepción de telemetría IoT | Suscriptor MQTT, node-exporter, cAdvisor | s-1vcpu-1gb | $6/mes |
| D — Base de datos | Persistencia aislada | PostgreSQL 18 + TimescaleDB + PostGIS, node-exporter, cAdvisor | s-1vcpu-2gb | $12/mes |

**Total: ~$54/mes**

> Solo el Droplet A tiene IP pública expuesta a internet. Los Droplets B, C y D son inaccesibles desde el exterior y solo se comunican por VPC.

---

### Fase 1 — Infraestructura en DigitalOcean

#### 1.1 Crear la VPC

Panel DO → **Networking** → **VPC** → **Create VPC**

- **Región:** elegir una (ej. NYC3) y mantener la misma para todos los Droplets.
- **Nombre:** `sana-vpc`
- **IP range:** dejar el valor predeterminado.

#### 1.2 Crear los cuatro Droplets

Para cada uno de los cuatro Droplets, usar la siguiente configuración base:

- **SO:** Ubuntu 24.04 LTS
- **Región:** la misma de la VPC
- **VPC Network:** `sana-vpc` ← obligatorio
- **Authentication:** SSH key (recomendado sobre contraseña)
- **Hostnames:** `sana-frontend`, `sana-backend`, `sana-ingest`, `sana-database`

Aplicar los tamaños de la tabla anterior a cada Droplet según su rol.

#### 1.3 Floating IP

DO → **Networking** → **Floating IPs** → **Create** → asignar al **Droplet A**.

La Floating IP es la dirección pública permanente del sistema. Si el Droplet A necesita ser reemplazado, la IP se reasigna sin cambiar la configuración DNS.

#### 1.4 Anotar las IPs privadas

En el panel de cada Droplet, copiar las IPs privadas de la VPC (rango 10.x.x.x). Estas se usarán en todos los pasos siguientes:

```
DROPLET_A_PRIVATE_IP = 10.x.x.x
DROPLET_B_PRIVATE_IP = 10.x.x.x
DROPLET_C_PRIVATE_IP = 10.x.x.x
DROPLET_D_PRIVATE_IP = 10.x.x.x
FLOATING_IP          = x.x.x.x
```

#### 1.5 Configurar DNS

En el proveedor de dominio, crear el siguiente registro:

```
A    tudominio.com    →    <FLOATING_IP>
```

Esperar la propagación DNS (puede tomar entre 5 minutos y 1 hora dependiendo del TTL configurado).

---

### Fase 2 — Setup base en cada Droplet

Conectarse por SSH a cada uno de los 4 Droplets y ejecutar los siguientes comandos en todos:

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar herramientas adicionales
apt install -y git ufw
```

#### Firewall — Droplet A (Frontend)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
# Prometheus recolecta métricas desde B
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 9100
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 8080
ufw enable
```

#### Firewall — Droplet B (Backend)

```bash
ufw allow OpenSSH
# API accesible desde A (Nginx proxy)
ufw allow from <DROPLET_A_PRIVATE_IP> to any port 8000
# Grafana accesible desde A (Nginx proxy)
ufw allow from <DROPLET_A_PRIVATE_IP> to any port 3001
ufw enable
```

#### Firewall — Droplet C (Ingest)

```bash
ufw allow OpenSSH
# MQTT público: los nodos IoT se conectan desde internet
ufw allow 1883/tcp
ufw allow 8883/tcp
# Prometheus recolecta métricas desde B
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 9100
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 8080
ufw enable
```

#### Firewall — Droplet D (Base de datos)

```bash
ufw allow OpenSSH
# PostgreSQL accesible solo desde B (API + Worker) y C (Ingest)
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 5432
ufw allow from <DROPLET_C_PRIVATE_IP> to any port 5432
# Prometheus recolecta métricas desde B
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 9100
ufw allow from <DROPLET_B_PRIVATE_IP> to any port 8080
ufw enable
```

**Verificar el estado del firewall en cada Droplet:**

```bash
ufw status verbose
```

---

### Fase 3 — Archivos de configuración

#### 3.1 Variables de entorno por Droplet

Crear el archivo `.env` en la raíz del repositorio clonado en cada Droplet. **Nunca commitear estos archivos.**

**Droplet A — `.env`**

```env
NEXT_PUBLIC_API_URL=https://tudominio.com/api
```

**Droplet B — `.env`**

```env
# Base de datos
DATABASE_URL=postgresql+asyncpg://sana:<DB_PASSWORD>@<DROPLET_D_PRIVATE_IP>:5432/sana_db

# Seguridad
SECRET_KEY=<clave-aleatoria-de-al-menos-64-caracteres>
ALLOWED_ORIGINS=https://tudominio.com

# Correo electrónico
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=no-reply@tudominio.com

# Entorno
ENVIRONMENT=production
LOG_FORMAT=json
FRONTEND_URL=https://tudominio.com

# Observabilidad
GRAFANA_PASSWORD=<contraseña-segura>
```

**Droplet C — `.env`**

```env
# Base de datos
DATABASE_URL=postgresql+asyncpg://sana:<DB_PASSWORD>@<DROPLET_D_PRIVATE_IP>:5432/sana_db

# EMQX Cloud
MQTT_HOST=<host-emqx-cloud>
MQTT_PORT=8883
MQTT_USERNAME=<usuario-emqx>
MQTT_PASSWORD=<contraseña-emqx>

# Entorno
LOG_FORMAT=json
```

**Droplet D — `.env`**

```env
DB_USER=sana
DB_PASSWORD=<contraseña-segura>
DB_NAME=sana_db
```

> **Seguridad:** Generar `SECRET_KEY` con al menos 64 caracteres aleatorios:
> ```bash
> openssl rand -hex 64
> ```

#### 3.2 Certificado CA de EMQX (Droplet C)

El suscriptor MQTT requiere el certificado CA del broker EMQX para establecer la conexión TLS. Descargar el certificado desde el panel de EMQX Cloud y copiarlo al Droplet C:

```bash
# Crear la carpeta de certificados
mkdir -p certs

# Copiar el archivo .crt o .pem descargado de EMQX Cloud
# (ejecutar desde la máquina local)
scp emqx-ca.crt root@<FLOATING_IP>:/root/sana/certs/ca.crt
```

#### 3.3 `infra/prometheus/prometheus.yml` (Droplet B)

Reemplazar las IPs con los valores reales de la Fase 1.4:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:

  - job_name: 'backend'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          droplet: 'backend'
      - targets: ['cadvisor:8080']
        labels:
          droplet: 'backend'

  - job_name: 'frontend'
    static_configs:
      - targets: ['<DROPLET_A_PRIVATE_IP>:9100']
        labels:
          droplet: 'frontend'
      - targets: ['<DROPLET_A_PRIVATE_IP>:8080']
        labels:
          droplet: 'frontend'

  - job_name: 'ingest'
    static_configs:
      - targets: ['<DROPLET_C_PRIVATE_IP>:9100']
        labels:
          droplet: 'ingest'
      - targets: ['<DROPLET_C_PRIVATE_IP>:8080']
        labels:
          droplet: 'ingest'

  - job_name: 'database'
    static_configs:
      - targets: ['<DROPLET_D_PRIVATE_IP>:9100']
        labels:
          droplet: 'database'
      - targets: ['<DROPLET_D_PRIVATE_IP>:8080']
        labels:
          droplet: 'database'
```

#### 3.4 `infra/nginx/nginx.conf` (Droplet A)

Reemplazar `tudominio.com` y `<DROPLET_B_PRIVATE_IP>` con los valores reales:

```nginx
upstream api_backend {
    server <DROPLET_B_PRIVATE_IP>:8000;
}

upstream web_frontend {
    server web:3000;
}

upstream grafana_backend {
    server <DROPLET_B_PRIVATE_IP>:3001;
}

server {
    listen 80;
    server_name tudominio.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location /api/ {
        proxy_pass         http://api_backend/;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location /grafana/ {
        proxy_pass         http://grafana_backend/;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass         http://web_frontend;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Forwarded-Host  $host;
        proxy_set_header   X-Forwarded-Port  $server_port;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

---

### Fase 4 — Certificado SSL

Ejecutar en **Droplet A**. El certificado se obtiene la primera vez con el nginx corriendo solo en HTTP.

```bash
# Paso 1: comentar temporalmente el bloque HTTPS en nginx.conf
# (dejar solo el bloque listen 80)

# Paso 2: levantar nginx en HTTP
docker compose -f docker-compose.frontend.yml up -d nginx

# Paso 3: obtener el certificado
docker compose -f docker-compose.frontend.yml run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email \
  -d tudominio.com
```

**Resultado esperado:**

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/tudominio.com/fullchain.pem
```

```bash
# Paso 4: descomentar el bloque HTTPS en nginx.conf y reiniciar
docker compose -f docker-compose.frontend.yml restart nginx
```

> El servicio `certbot` en el compose renueva el certificado automáticamente cada 12 horas. No se requiere intervención manual para renovaciones futuras.

---

### Fase 5 — Deploy en orden

El orden es obligatorio: la base de datos debe estar disponible antes de que el backend intente conectarse, y el backend antes de que el frontend intente consumir la API.

#### 5.1 Droplet D — Base de datos (primero)

```bash
# Conectarse al Droplet D
ssh root@<DROPLET_D_IP>

# Clonar el repositorio
git clone https://github.com/JesusPetro/sana-airlytics.git sana
cd sana

# Crear el .env (ver sección 3.1)
nano .env

# Levantar la base de datos
docker compose -f docker-compose.db.yml up -d --build

# Verificar que está saludable
docker compose -f docker-compose.db.yml ps
# Resultado esperado: db   running (healthy)

docker compose -f docker-compose.db.yml logs db | tail -20
```

#### 5.2 Droplet B — Backend

```bash
# Conectarse al Droplet B
ssh root@<DROPLET_B_IP>

# Clonar el repositorio
git clone https://github.com/JesusPetro/sana-airlytics.git sana
cd sana

# Crear el .env (ver sección 3.1)
nano .env

# Crear el archivo prometheus.yml con las IPs reales (ver sección 3.3)
mkdir -p infra/prometheus
nano infra/prometheus/prometheus.yml

# Levantar el backend
docker compose -f docker-compose.backend.yml up -d --build

# Verificar que las migraciones se aplicaron correctamente
docker compose -f docker-compose.backend.yml logs api | grep -i "alembic\|migration\|startup"

# Verificar que la API responde
curl http://localhost:8000/api/health
# Resultado esperado: {"status": "ok"}
```

#### 5.3 Droplet C — Ingest

```bash
# Conectarse al Droplet C
ssh root@<DROPLET_C_IP>

# Clonar el repositorio
git clone https://github.com/JesusPetro/sana-airlytics.git sana
cd sana

# Crear el .env (ver sección 3.1)
nano .env

# Copiar el certificado CA de EMQX (ver sección 3.2)
mkdir -p certs
# (copiar el archivo ca.crt desde la máquina local con scp)

# Levantar el servicio de ingesta
docker compose -f docker-compose.ingest.yml up -d --build

# Verificar logs
docker compose -f docker-compose.ingest.yml logs ingest | tail -20
```

#### 5.4 Droplet A — Frontend (último)

```bash
# Conectarse al Droplet A
ssh root@<DROPLET_A_IP>

# Clonar el repositorio
git clone https://github.com/JesusPetro/sana-airlytics.git sana
cd sana

# Crear el .env (ver sección 3.1)
nano .env

# Actualizar nginx.conf con las IPs reales (ver sección 3.4)
nano infra/nginx/nginx.conf

# Obtener certificado SSL (ver Fase 4) y luego levantar el frontend
docker compose -f docker-compose.frontend.yml up -d --build

# Verificar que el frontend está accesible
curl -I https://tudominio.com
# Resultado esperado: HTTP/2 200
```

---

### Fase 6 — Configurar Grafana

1. Abrir `https://tudominio.com/grafana` en el navegador.
2. Iniciar sesión con usuario `admin` y la contraseña `GRAFANA_PASSWORD` del `.env` del Droplet B.
3. **Agregar fuente de datos:**
   - Ir a **Connections** → **Data sources** → **Add data source**.
   - Seleccionar **Prometheus**.
   - URL: `http://prometheus:9090`
   - Hacer clic en **Save & Test**.
   - Resultado esperado: `Data source is working`.
4. **Importar dashboard:**
   - Ir a **Dashboards** → **Import**.
   - ID del dashboard: `1860` (Node Exporter Full).
   - Hacer clic en **Load**.
   - Seleccionar el data source Prometheus creado en el paso anterior.
   - Hacer clic en **Import**.

El dashboard muestra CPU, RAM, disco y red por Droplet con filtro por label `droplet`.

---

## 7. Verificación del sistema completo

Una vez completado el despliegue, verificar que el sistema funciona correctamente usando la siguiente lista de comprobación. Cada punto es auditable con el comando o acción indicada.

- [ ] **Health check de la API**
  ```bash
  curl https://tudominio.com/api/health
  # Resultado esperado: {"status": "ok"}
  ```

- [ ] **Dashboard web accesible**
  Abrir `https://tudominio.com` en el navegador. La página de inicio de sesión debe cargarse sin errores.

- [ ] **Registro de usuario**
  Crear una cuenta nueva desde el formulario de registro. Verificar que llega el correo de bienvenida (confirma que Resend está configurado correctamente).

- [ ] **Creación de workspace y registro de dispositivo**
  Crear un workspace, registrar un dispositivo y copiar las credenciales MQTT generadas. Configurarlas en el firmware del nodo físico (ver Manual de Firmware).

- [ ] **Primera medición visible en el dashboard**
  Encender el nodo físico con las credenciales configuradas. Dentro de los primeros 5 minutos de transmisión, la vista de dispositivos debe mostrar el nodo como `Online` y el dashboard debe mostrar los primeros datos.

- [ ] **Sistema de alertas**
  Crear una regla de alerta con un umbral bajo (ej. temperatura > 20 °C). Esperar el siguiente ciclo del worker (máximo 5 minutos). Verificar que llega el correo de notificación.

- [ ] **Acceso a Grafana**
  Abrir `https://tudominio.com/grafana`. Verificar que el dashboard de Node Exporter muestra métricas de los 4 Droplets.

- [ ] **Aislamiento multi-tenant**
  Crear un segundo workspace con un usuario diferente. Intentar acceder a los datos del primer workspace con el segundo usuario. La API debe devolver HTTP 403.

- [ ] **Verificación de roles RBAC**
  Invitar a un colaborador con rol `visualizador`. Verificar que no puede crear ni eliminar dispositivos ni alertas.

- [ ] **Logs de los servicios**
  ```bash
  # En Droplet B
  docker compose -f docker-compose.backend.yml logs api --tail 50
  docker compose -f docker-compose.backend.yml logs worker --tail 50

  # En Droplet C
  docker compose -f docker-compose.ingest.yml logs ingest --tail 50
  ```
  Los logs deben mostrar actividad normal sin errores de conexión ni excepciones no controladas.

---

## 8. Actualizaciones futuras

Para actualizar el sistema con una nueva versión del código, ejecutar en cada Droplet en el mismo orden del despliegue inicial:

```bash
# En cada Droplet: obtener los cambios del repositorio
git pull origin main
```

```bash
# Droplet D (solo si hay cambios en el esquema de base de datos)
docker compose -f docker-compose.db.yml up -d --build

# Droplet B
docker compose -f docker-compose.backend.yml up -d --build

# Droplet C
docker compose -f docker-compose.ingest.yml up -d --build

# Droplet A
docker compose -f docker-compose.frontend.yml up -d --build
```

> **Nota:** Docker Compose reemplaza solo los contenedores cuya imagen cambió. Los contenedores sin cambios no se reinician, minimizando el tiempo de inactividad.

---

## Apéndice A — Variables de entorno

Referencia completa de todas las variables de entorno del sistema.

| Variable | Droplet | Descripción | Ejemplo |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | A | URL base de la API consumida por el frontend | `https://tudominio.com/api` |
| `DATABASE_URL` | B, C | Cadena de conexión a PostgreSQL con asyncpg | `postgresql+asyncpg://sana:pass@10.x.x.x:5432/sana_db` |
| `SECRET_KEY` | B | Clave para firma de tokens JWT. Mínimo 64 caracteres. | `openssl rand -hex 64` |
| `ALLOWED_ORIGINS` | B | Origen permitido en CORS. Debe coincidir con el dominio del frontend. | `https://tudominio.com` |
| `RESEND_API_KEY` | B | API key de Resend para envío de correos | `re_xxxxxxxxxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | B | Dirección remitente de los correos de alerta | `no-reply@tudominio.com` |
| `ENVIRONMENT` | B | Modo de ejecución. En producción: `production`. | `production` |
| `LOG_FORMAT` | B, C | Formato de logs. `json` para producción, `text` para desarrollo. | `json` |
| `FRONTEND_URL` | B | URL del frontend. Usada para construir enlaces en correos. | `https://tudominio.com` |
| `GRAFANA_PASSWORD` | B | Contraseña del usuario `admin` de Grafana. | (contraseña segura) |
| `MQTT_HOST` | C | Hostname del broker EMQX Cloud | `xxxx.emqx.cloud` |
| `MQTT_PORT` | C | Puerto MQTT con TLS | `8883` |
| `MQTT_USERNAME` | C | Usuario del suscriptor en EMQX Cloud | `sana_ingest` |
| `MQTT_PASSWORD` | C | Contraseña del suscriptor en EMQX Cloud | (contraseña segura) |
| `DB_USER` | D | Usuario de PostgreSQL | `sana` |
| `DB_PASSWORD` | D | Contraseña de PostgreSQL. Debe coincidir con `DATABASE_URL` en B y C. | (contraseña segura) |
| `DB_NAME` | D | Nombre de la base de datos | `sana_db` |

> **Seguridad:** Los valores de producción de estas variables no deben compartirse públicamente ni incluirse en el repositorio.

---

## Apéndice B — Puertos y red

| Puerto | Servicio | Droplet | Accesible desde | Descripción |
|---|---|---|---|---|
| 80 | Nginx | A | Internet | Redirección HTTP → HTTPS |
| 443 | Nginx | A | Internet | Tráfico HTTPS cifrado. Único punto de entrada público. |
| 8000 | FastAPI | B | Droplet A (VPC) | API REST del backend |
| 3001 | Grafana | B | Droplet A (VPC) | Panel de observabilidad (proxy por Nginx en `/grafana/`) |
| 9090 | Prometheus | B | localhost | Recolector de métricas (no expuesto a la VPC) |
| 1883 | EMQX | C | Internet | MQTT sin TLS (no recomendado en producción) |
| 8883 | EMQX | C | Internet | MQTT con TLS. Puerto usado por los nodos físicos. |
| 5432 | PostgreSQL | D | Droplets B y C (VPC) | Base de datos. No accesible desde internet. |
| 9100 | node-exporter | A, B, C, D | Droplet B (VPC) | Métricas del sistema operativo host |
| 8080 | cAdvisor | A, B, C, D | Droplet B (VPC) | Métricas de contenedores Docker |

---

## Apéndice C — Solución de problemas comunes

| Problema | Posible causa | Solución recomendada |
|---|---|---|
| `curl https://tudominio.com/api/health` devuelve `502 Bad Gateway` | El contenedor de la API no está corriendo en el Droplet B, o el Nginx no puede alcanzarlo por VPC. | Verificar con `docker compose -f docker-compose.backend.yml ps` que el contenedor `api` está `running (healthy)`. Revisar que la IP del Droplet B en `nginx.conf` es correcta. |
| La API devuelve `500 Internal Server Error` en el primer arranque | Las migraciones no se aplicaron correctamente. | Revisar los logs: `docker compose -f docker-compose.backend.yml logs api`. Ejecutar manualmente: `docker compose -f docker-compose.backend.yml exec api uv run alembic upgrade head`. |
| El contenedor de base de datos no pasa a estado `healthy` | Contraseña incorrecta en el `.env`, o el volumen de datos está corrupto. | Verificar que `DB_USER`, `DB_PASSWORD` y `DB_NAME` en el `.env` del Droplet D son correctos. Si el volumen está corrupto: `docker compose -f docker-compose.db.yml down -v && docker compose -f docker-compose.db.yml up -d --build`. |
| El nodo físico aparece `Offline` en la plataforma | El suscriptor MQTT del Droplet C no está recibiendo mensajes, o las credenciales del dispositivo son incorrectas. | Revisar logs del ingest: `docker compose -f docker-compose.ingest.yml logs ingest`. Verificar que el certificado CA en `certs/ca.crt` es el correcto para el broker EMQX. Confirmar que los puertos 1883 y 8883 están abiertos en el firewall del Droplet C. |
| El certificado SSL no se obtiene (`certbot` falla) | El registro DNS aún no propagó, o el puerto 80 no está accesible. | Verificar propagación DNS con `dig tudominio.com`. Confirmar que el bloque HTTPS está comentado en `nginx.conf` durante el proceso de obtención del certificado. Verificar que el puerto 80 está abierto: `ufw status`. |
| Grafana no muestra métricas de algún Droplet | El `node-exporter` o `cAdvisor` de ese Droplet no está corriendo, o el firewall bloquea la conexión desde el Droplet B. | Verificar que los contenedores de monitoreo están activos en el Droplet afectado. Confirmar las reglas de firewall: `ufw status verbose`. Revisar el `prometheus.yml` y verificar que la IP privada del Droplet afectado es correcta. |
| El worker no envía alertas | API key de Resend inválida, o el dominio remitente no está verificado en Resend. | Verificar logs: `docker compose -f docker-compose.backend.yml logs worker`. Confirmar en el panel de Resend que el dominio está verificado y que la API key tiene permisos de envío. |
| Error `connection refused` al conectar la API a la base de datos | La IP privada del Droplet D en `DATABASE_URL` es incorrecta, o el firewall del Droplet D no permite conexiones desde el Droplet B. | Verificar `DROPLET_D_PRIVATE_IP` en la consola de DigitalOcean. Confirmar la regla de firewall: en el Droplet D, `ufw status` debe mostrar el puerto 5432 permitido desde la IP del Droplet B. |

> **Consejo general:** ante cualquier problema no listado aquí, el primer paso es siempre revisar los logs del servicio afectado con `docker compose -f <archivo>.yml logs <servicio> --tail 100`. Los logs en formato JSON (producción) son más fáciles de filtrar con `jq`:
> ```bash
> docker compose -f docker-compose.backend.yml logs api --tail 100 | jq .
> ```
