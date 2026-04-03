# entrypoint.sh
#!/bin/bash

alembic upgrade head
exec "$@"

