"""
Reset the development database: drop all tables and re-run all migrations.

Usage:
    python scripts/db_reset.py           # asks for confirmation
    python scripts/db_reset.py --yes     # skips confirmation (CI / scripting)
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def _psycopg2_url(url: str) -> str:
    """Strip async driver prefix so psycopg2 can use the URL."""
    return url.replace("postgresql+asyncpg://", "postgresql://").replace(
        "postgresql+psycopg2://", "postgresql://"
    )


def drop_all(url: str) -> None:
    conn = psycopg2.connect(url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("DROP EXTENSION IF EXISTS timescaledb CASCADE")
    cur.execute("DROP SCHEMA IF EXISTS public CASCADE")
    cur.execute("CREATE SCHEMA public")
    cur.close()
    conn.close()


def upgrade_head() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=ROOT,
    )
    if result.returncode != 0:
        print("alembic upgrade head failed")
        sys.exit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset the development database.")
    parser.add_argument(
        "--yes", "-y", action="store_true", help="Skip confirmation prompt."
    )
    args = parser.parse_args()

    if not DATABASE_URL:
        print("ERROR: DATABASE_URL is not set. Add it to your .env file.")
        sys.exit(1)

    if not args.yes:
        confirm = input(
            "This will DESTROY all data in the database. Type 'yes' to continue: "
        )
        if confirm.strip().lower() != "yes":
            print("Aborted.")
            sys.exit(0)

    print("→ Dropping schema...")
    drop_all(_psycopg2_url(DATABASE_URL))

    print("→ Running migrations...")
    upgrade_head()

    print("✓ Database reset complete.")


if __name__ == "__main__":
    main()
