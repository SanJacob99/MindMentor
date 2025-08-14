from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db import get_db
from app.schemas import JournalCreate
from app.models import Journal, Tag, JournalTag, User  # JournalTag is a Table
from .auth import get_current_user

router = APIRouter(prefix="/journals", tags=["journals"])


@router.post("", status_code=201)
async def create_journal(
    payload: JournalCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Create a journal entry for the authenticated user.
    - Upserts tags by name (lowercased)
    - Links via JournalTag (composite PK: journal_id + tag_id)
    - Uses ON CONFLICT DO NOTHING to avoid duplicates
    """
    print(payload)
    # 1) Create the journal row
    j = Journal(user_id=user.user_id, content=payload.content, mood=payload.mood)
    db.add(j)
    await db.flush()  # get j.journal_id

    # 2) Upsert + link tags
    for raw in (payload.tags or []):
        name = (raw or "").strip().lower()
        if not name:
            continue

        # get-or-create tag
        res = await db.execute(select(Tag).where(Tag.name == name))
        tag = res.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()  # get tag.tag_id

        # link in association table (JournalTag is a Table here)
        stmt = (
            pg_insert(JournalTag)
            .values(journal_id=j.journal_id, tag_id=tag.tag_id)
            .on_conflict_do_nothing(index_elements=["journal_id", "tag_id"])
        )
        await db.execute(stmt)

    await db.commit()
    return {"journal_id": j.journal_id}


@router.get("", summary="List journals for current user")
async def list_journals(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = (
        select(Journal)
        .where(Journal.user_id == user.user_id)
        .order_by(Journal.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(q)).scalars().all()
    return [
        {
            "journal_id": r.journal_id,
            "content": r.content,
            "mood": r.mood,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.delete("/{journal_id}", status_code=204)
async def delete_journal(
    journal_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = delete(Journal).where(
        Journal.journal_id == journal_id, Journal.user_id == user.user_id
    )
    res = await db.execute(q)
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Not found")
    await db.commit()
