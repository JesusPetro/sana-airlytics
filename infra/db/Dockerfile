FROM timescale/timescaledb:latest-pg17

RUN apk add --no-cache postgis \
    && cp -a /usr/share/postgresql17/extension/. /usr/local/share/postgresql/extension/ \
    && cp /usr/lib/postgresql17/postgis*.so /usr/local/lib/postgresql/
