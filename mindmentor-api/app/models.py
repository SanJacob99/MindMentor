from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, SmallInteger, Boolean, ForeignKey, CheckConstraint, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, BIGINT
from sqlalchemy import MetaData

NAMING = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

APP_SCHEMA = "app"


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING)


# ---------- USERS ----------
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": APP_SCHEMA}
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))

    journals: Mapped[List["Journal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sessions: Mapped[List["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    reminders: Mapped[List["Reminder"]] = relationship(back_populates="user", cascade="all, delete-orphan")

# ---------- JOURNALS ----------
class Journal(Base):
    __tablename__ = "journals"
    __table_args__ = (
        CheckConstraint("mood IS NULL OR mood BETWEEN 1 AND 10", name="ck_journals_mood"),
        {"schema": APP_SCHEMA},
    )
    journal_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey(f"{APP_SCHEMA}.users.user_id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mood: Mapped[Optional[int]] = mapped_column(SmallInteger)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))

    user: Mapped["User"] = relationship(back_populates="journals")
    tags: Mapped[List["Tag"]] = relationship(
        secondary=f"{APP_SCHEMA}.journal_tags",
        back_populates="journals",
        lazy="selectin",
    )

# ---------- TAGS ----------
class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = {"schema": APP_SCHEMA}
    tag_id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    journals: Mapped[List[Journal]] = relationship(
        secondary=f"{APP_SCHEMA}.journal_tags",
        back_populates="tags",
        lazy="selectin",
    )

# ---------- JOURNAL_TAGS (association table only) ----------
from sqlalchemy import Table, Column
JournalTag = Table(
    "journal_tags",
    Base.metadata,
    Column("journal_id", UUID(as_uuid=False), ForeignKey(f"{APP_SCHEMA}.journals.journal_id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", BIGINT, ForeignKey(f"{APP_SCHEMA}.tags.tag_id", ondelete="CASCADE"), primary_key=True),
    schema=APP_SCHEMA,
)

# ---------- SESSIONS ----------
class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint("session_type IN ('chat','checkin','exercise')", name="ck_sessions_type"),
        CheckConstraint("ended_at IS NULL OR ended_at >= started_at", name="ck_sessions_time"),
        {"schema": APP_SCHEMA},
    )
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey(f"{APP_SCHEMA}.users.user_id", ondelete="CASCADE"), nullable=False)
    session_type: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))
    ended_at: Mapped[Optional[datetime]]

    user: Mapped["User"] = relationship(back_populates="sessions")
    messages: Mapped[List["Message"]] = relationship(back_populates="session", cascade="all, delete-orphan")

# ---------- MESSAGES ----------
class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint("role IN ('user','mentor','system')", name="ck_messages_role"),
        {"schema": APP_SCHEMA},
    )
    message_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey(f"{APP_SCHEMA}.sessions.session_id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))

    session: Mapped["Session"] = relationship(back_populates="messages")

# ---------- REMINDERS ----------
class Reminder(Base):
    __tablename__ = "reminders"
    __table_args__ = (
        CheckConstraint("kind IN ('daily_checkin','exercise','custom')", name="ck_reminders_kind"),
        {"schema": APP_SCHEMA},
    )
    reminder_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey(f"{APP_SCHEMA}.users.user_id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String(50), nullable=False)
    schedule_cron: Mapped[str] = mapped_column(String(120), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, server_default=text("'America/New_York'"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))

    user: Mapped["User"] = relationship(back_populates="reminders")
