from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_db
from .. import models, schemas

router = APIRouter(prefix="/journals", tags=["journals"])

@router.post("", response_model=schemas.JournalOut, status_code=201)
async def create_journal(payload: schemas.JournalCreate, db: AsyncSession = Depends(get_db)):
    # Ensure user exists
    user = await db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    journal = models.Journal(user_id=payload.user_id, content=payload.content, mood=payload.mood)
    db.add(journal)
    # Handle tags by name (create if missing)
    tag_names = [t.strip() for t in (payload.tags or []) if t.strip()]
    if tag_names:
        # fetch existing
        res = await db.execute(select(models.Tag).where(models.Tag.name.in_(tag_names)))
        existing = {t.name: t for t in res.scalars()}
        # create missing
        for name in tag_names:
            if name not in existing:
                t = models.Tag(name=name)
                db.add(t)
                existing[name] = t
        await db.flush()
        journal.tags = list(existing.values())

    await db.commit()
    await db.refresh(journal)
    # shape response with tag names
    return schemas.JournalOut(
        journal_id=journal.journal_id,
        user_id=journal.user_id,
        content=journal.content,
        mood=journal.mood,
        created_at=journal.created_at,
        tags=[t.name for t in journal.tags] if journal.tags else []
    )

@router.get("", response_model=list[schemas.JournalOut])
async def list_journals(
    user_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(models.Journal).order_by(models.Journal.created_at.desc()).limit(limit)
    if user_id:
        q = q.where(models.Journal.user_id == user_id)
    res = await db.execute(q)
    journals = res.scalars().unique().all()

    # eager-load tags names (they're lazy=selectin, so access populates)
    return [
        schemas.JournalOut(
            journal_id=j.journal_id,
            user_id=j.user_id,
            content=j.content,
            mood=j.mood,
            created_at=j.created_at,
            tags=[t.name for t in j.tags] if j.tags else []
        )
        for j in journals
    ]
