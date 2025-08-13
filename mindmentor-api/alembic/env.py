import os, sys, asyncio
from logging.config import fileConfig
from sqlalchemy import pool, text
from alembic import context

# Make `app` importable when running from project root
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from app.config import settings
from app.models import Base  # Base.metadata is your models' metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

CONFIGURE_KW = dict(
    target_metadata=target_metadata,
    include_schemas=True,           # include non-public schemas
    version_table_schema="app",     # store version table inside app schema
    compare_type=True,
    compare_server_default=True,
)

def run_migrations_offline():
    url = os.getenv("MIGRATIONS_DATABASE_URL", settings.DATABASE_URL)
    context.configure(url=url, literal_binds=True, dialect_opts={"paramstyle": "named"}, **CONFIGURE_KW)
    with context.begin_transaction():
        context.run_migrations()

def _do_run_migrations(connection):
    # Ensure the schema exists (safe if already present)
    connection.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
    context.configure(connection=connection, **CONFIGURE_KW)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    from sqlalchemy.ext.asyncio import async_engine_from_config
    url = os.getenv("MIGRATIONS_DATABASE_URL", settings.DATABASE_URL)
    engine = async_engine_from_config({"sqlalchemy.url": url}, prefix="sqlalchemy.", poolclass=pool.NullPool)
    async with engine.connect() as conn:
        await conn.run_sync(_do_run_migrations)
    await engine.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
