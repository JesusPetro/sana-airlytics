FROM timescale/timescaledb:latest-pg17

RUN apk add --no-cache postgresql17-postgis \
    && mkdir -p /usr/local/share/postgresql/extension \
    && mkdir -p /usr/local/lib/postgresql \
    && find /usr/share/postgresql17/extension -name 'postgis*' \
       -exec ln -sf {} /usr/local/share/postgresql/extension/ \; \
    && find /usr/lib/postgresql17/ -name 'postgis*' \
       -exec ln -sf {} /usr/local/lib/postgresql/ \;