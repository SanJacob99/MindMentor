from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from fastapi.security import OAuth2PasswordBearer
from app.db import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, Token, Login
from app.security import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where(User.email == payload.email))
    if exists.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    u = User(
        email=payload.email,
        display_name=payload.display_name or None,
        hashed_password=hash_password(payload.password),
    )
    db.add(u)
    await db.flush()
    await db.commit()
    await db.refresh(u)  # pull server defaults (created_at, is_active)
    return UserOut.model_validate(u)

@router.post("/login", response_model=Token)
async def login(payload: Login, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == payload.email))
    u = res.scalar_one_or_none()
    if not u or not verify_password(payload.password, u.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    return Token(access_token=create_access_token(str(u.user_id)))

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    try:
        payload = decode_token(token)
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    res = await db.execute(select(User).where(User.user_id == uid))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(401, "User not found")
    return u
