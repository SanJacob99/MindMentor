from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# ---------- Users ----------
class UserCreate(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    password: str = Field(min_length=8)

class UserOut(BaseModel):
    user_id: str
    email: EmailStr
    display_name: Optional[str]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ---------- Journals ----------
class JournalCreate(BaseModel):
    user_id: str
    content: str
    mood: Optional[int] = None
    tags: Optional[List[str]] = None   # tag names

class JournalOut(BaseModel):
    journal_id: str
    user_id: str
    content: str
    mood: Optional[int]
    created_at: datetime
    tags: List[str] = []
    class Config:
        from_attributes = True
