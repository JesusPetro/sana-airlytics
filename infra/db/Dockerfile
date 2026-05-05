FROM timescale/timescaledb:latest-pg17

RUN apk add --no-cache postgis \
    && find /usr/share/postgresql17/extension -name 'postgis*' \
       -exec ln -sf {} /usr/local/share/postgresql/extension/ \; \
    && find /usr/lib/postgresql17/ -name 'postgis*' \
       -exec ln -sf {} /usr/local/lib/postgresql/ \;