import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

# Make your app importable when running alembic from project root
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

# Import settings + Base.metadata from your app
from app.config import settings
from app.models import Base  # Base.metadata must include all models

# Alembic Config object
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

CONFIGURE_KW = dict(
    target_metadata=target_metadata,
    include_schemas=True,
    version_table_schema="app",
    compare_type=True,
    compare_server_default=True,
)

def _get_url_sync() -> str:
    """Prefer MIGRATIONS_DATABASE_URL; fall back to DATABASE_URL.
    Strip '+asyncpg' so we use psycopg2 for migrations."""
    url = os.getenv("MIGRATIONS_DATABASE_URL") or settings.DATABASE_URL
    if not url:
        raise RuntimeError("Set MIGRATIONS_DATABASE_URL or DATABASE_URL.")
    return url.replace("+asyncpg", "")

def run_migrations_offline():
    url = _get_url_sync()
    context.configure(
        url=url,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        **CONFIGURE_KW,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    url = _get_url_sync()
    engine = create_engine(url, poolclass=NullPool, future=True)
    with engine.begin() as conn:
        # Ensure schema exists (no-op if it already does)
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        context.configure(connection=conn, **CONFIGURE_KW)
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
