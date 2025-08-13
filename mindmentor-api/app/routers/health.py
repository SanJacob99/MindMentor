from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.db import get_session

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
async def health():
    return {"status": "ok"}


@router.get("/health/db")
async def db_health(session = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"ok": True}