from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from .config import settings

engine = create_async_engine(
    settings.DATABASE_URL.unicode_string(),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)

async def get_db():
    async with SessionLocal() as session:
        yield session
