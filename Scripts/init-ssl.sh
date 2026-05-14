#!/bin/bash
set -e

DOMAIN="${DOMAIN:-airlytics.tech}"
EMAIL="${EMAIL:?ERROR: set EMAIL before running this script (e.g. EMAIL=you@example.com ./scripts/init-ssl.sh)}"
COMPOSE_FILE="docker-compose.frontend.yml"
NGINX_CONF="infra/nginx/nginx.conf"
NGINX_CONF_BACKUP="${NGINX_CONF}.bak"

# Resolve project name (used as docker volume prefix)
PROJECT=$(docker compose -f "$COMPOSE_FILE" config --format json 2>/dev/null | grep '"name"' | head -1 | sed 's/.*"name": "\(.*\)".*/\1/' || basename "$(pwd)")

CERTBOT_ETC_VOL="${PROJECT}_certbot-etc"
CERTBOT_WWW_VOL="${PROJECT}_certbot-www"

echo "==> Backing up nginx.conf"
cp "$NGINX_CONF" "$NGINX_CONF_BACKUP"

echo "==> Writing temporary HTTP-only nginx.conf"
cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF

echo "==> Starting nginx with temporary config"
docker compose -f "$COMPOSE_FILE" stop certbot 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" up -d nginx

echo "==> Waiting for nginx to be ready..."
sleep 3

echo "==> Verifying nginx is reachable on port 80"
if ! curl -sf "http://${DOMAIN}/.well-known/acme-challenge/test" > /dev/null 2>&1; then
  echo "    (404 is expected — nginx is up)"
fi

echo "==> Running certbot"
docker run --rm \
  -v "${CERTBOT_ETC_VOL}:/etc/letsencrypt" \
  -v "${CERTBOT_WWW_VOL}:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.${DOMAIN}"

echo "==> Restoring full nginx.conf with SSL"
cp "$NGINX_CONF_BACKUP" "$NGINX_CONF"

echo "==> Restarting nginx with SSL config"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate nginx

echo "==> Starting certbot renewal service"
docker compose -f "$COMPOSE_FILE" up -d certbot

sleep 3

echo "==> Verifying HTTPS"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "https://${DOMAIN}" || true)
if [ "$HTTP_CODE" = "200" ]; then
  echo "==> Done. https://${DOMAIN} is up (HTTP $HTTP_CODE)"
else
  echo "==> Warning: got HTTP $HTTP_CODE — check docker logs sana-nginx-1"
fi
