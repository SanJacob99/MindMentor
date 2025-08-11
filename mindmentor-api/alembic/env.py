import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context

# --- Make 'app' importable when running alembic from project root ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

# Load settings and metadata from our app
from app.config import settings
from app.models import Base

# Alembic Config object
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for 'autogenerate'
target_metadata = Base.metadata

# Common configure kwargs
configure_kwargs = dict(
    target_metadata=target_metadata,
    include_schemas=True,                # include the "app" schema
    version_table_schema="app",          # store alembic version table inside app schema
    compare_server_default=True,         # catch server_default differences
)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL.unicode_string()
    context.configure(
        url=url,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        **configure_kwargs,
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, **configure_kwargs)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode with async engine."""
    from sqlalchemy.ext.asyncio import async_engine_from_config
    connectable = async_engine_from_config(
        {"sqlalchemy.url": settings.DATABASE_URL.unicode_string()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())
