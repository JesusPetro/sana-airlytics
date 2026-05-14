FROM timescale/timescaledb:latest-pg18

RUN apk add --no-cache postgis \
    && mkdir -p /usr/local/share/postgresql/extension \
    && mkdir -p /usr/local/lib/postgresql \
    && find /usr/share/postgresql18/extension -name 'postgis*' \
       -exec ln -sf {} /usr/local/share/postgresql/extension/ \; \
    && find /usr/lib/postgresql18/ -name 'postgis*' \
       -exec ln -sf {} /usr/local/lib/postgresql/ \;

COPY init.sql /docker-entrypoint-initdb.d/init.sql