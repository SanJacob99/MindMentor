from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from uuid import UUID

# ---------- Users ----------
class UserCreate(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    password: str = Field(min_length=8)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # pydantic v2
    user_id: UUID
    email: EmailStr
    display_name: str | None = None
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Login(BaseModel):
    email: EmailStr
    password: str

# ---------- Journals ----------
class JournalCreate(BaseModel):
    content: str = Field(min_length=1)
    mood: Optional[int] = Field(default=None, ge=1, le=10)
    # Accept ["daily","work"] or "daily, work" or omitted
    tags: Optional[Union[List[str], str]] = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v):
        if v is None or v == "":
            return []
        if isinstance(v, str):
            return [p.strip() for p in v.split(",") if p.strip()]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return []

class JournalOut(BaseModel):
    journal_id: str
    user_id: str
    content: str
    mood: Optional[int]
    created_at: datetime
    tags: List[str] = []
    class Config:
        from_attributes = True
