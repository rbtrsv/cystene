from typing import AsyncGenerator
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Database URL from settings
DATABASE_URL = settings.DATABASE_URL

# Function to generate unique statement names for pgbouncer compatibility
def unique_statement_name():
    return f"__asyncpg_{uuid4().hex}__"

# Engine with minimal pgbouncer compatibility
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)

# Base class that all models must inherit from for migrations to work
# Models not inheriting from Base won't be detected by Alembic
Base = declarative_base()

# Async session factory for all operations
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Initialize database tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Dependency to get database session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session