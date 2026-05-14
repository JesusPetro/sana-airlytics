FROM timescale/timescaledb:latest-pg17

RUN apk add --no-cache postgis \
    && mkdir -p /usr/local/share/postgresql/extension \
    && mkdir -p /usr/local/lib/postgresql \
    && PG_MAJOR=$(pg_config --version | grep -oE '[0-9]+' | head -1) \
    && find /usr/share/postgresql${PG_MAJOR}/extension -name 'postgis*' \
       -exec ln -sf {} /usr/local/share/postgresql/extension/ \; \
    && find /usr/lib/postgresql${PG_MAJOR}/ -name 'postgis*' \
       -exec ln -sf {} /usr/local/lib/postgresql/ \;