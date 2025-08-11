from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_db
from .. import models, schemas
from ..security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=schemas.UserOut, status_code=201)
async def create_user(payload: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # enforce case-insensitive uniqueness like DB index lower(email)
    q = select(models.User).where(func.lower(models.User.email) == func.lower(payload.email))
    existing = (await db.execute(q)).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Email already registered")

    user = models.User(
        email=payload.email,
        display_name=payload.display_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("", response_model=list[schemas.UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.User).order_by(models.User.created_at.desc()).limit(50))
    return list(res.scalars().all())
