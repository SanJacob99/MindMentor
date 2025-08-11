-- MindMentor PostgreSQL bootstrap (schema + seed). Safe for DEV.
-- Requires Postgres 13+.
BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

-- App schema
CREATE SCHEMA IF NOT EXISTS app;

-- DEV ONLY: drop old objects
DROP TABLE IF EXISTS app.journal_tags      CASCADE;
DROP TABLE IF EXISTS app.messages          CASCADE;
DROP TABLE IF EXISTS app.sessions          CASCADE;
DROP TABLE IF EXISTS app.reminders         CASCADE;
DROP TABLE IF EXISTS app.journals          CASCADE;
DROP TABLE IF EXISTS app.tags              CASCADE;
DROP TABLE IF EXISTS app.users             CASCADE;

-- Optional updated_at trigger
CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- USERS
CREATE TABLE app.users (
  user_id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  email           varchar(320)   NOT NULL,
  display_name    varchar(120),
  hashed_password varchar(200)   NOT NULL,
  is_active       boolean        NOT NULL DEFAULT true,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);
-- case-insensitive uniqueness for emails
CREATE UNIQUE INDEX ux_users_email_ci ON app.users (lower(email));
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON app.users
FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

-- JOURNALS
CREATE TABLE app.journals (
  journal_id  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES app.users(user_id) ON DELETE CASCADE,
  content     text         NOT NULL,
  mood        smallint,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT ck_journals_mood CHECK (mood IS NULL OR mood BETWEEN 1 AND 10)
);
CREATE INDEX ix_journals_user_created ON app.journals(user_id, created_at DESC);

-- TAGS
CREATE TABLE app.tags (
  tag_id bigserial PRIMARY KEY,
  name   varchar(50) NOT NULL UNIQUE
);

-- JOURNAL_TAGS (M2M)
CREATE TABLE app.journal_tags (
  journal_id uuid NOT NULL REFERENCES app.journals(journal_id) ON DELETE CASCADE,
  tag_id     bigint NOT NULL REFERENCES app.tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (journal_id, tag_id)
);
CREATE INDEX ix_journal_tags_tag ON app.journal_tags(tag_id);

-- SESSIONS
CREATE TABLE app.sessions (
  session_id    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES app.users(user_id) ON DELETE CASCADE,
  session_type  varchar(20)  NOT NULL,
  started_at    timestamptz  NOT NULL DEFAULT now(),
  ended_at      timestamptz,
  CONSTRAINT ck_sessions_type CHECK (session_type IN ('chat','checkin','exercise')),
  CONSTRAINT ck_sessions_time CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX ix_sessions_user_started ON app.sessions(user_id, started_at DESC);

-- MESSAGES
CREATE TABLE app.messages (
  message_id uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid         NOT NULL REFERENCES app.sessions(session_id) ON DELETE CASCADE,
  role       varchar(16)  NOT NULL,
  content    text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT ck_messages_role CHECK (role IN ('user','mentor','system'))
);
CREATE INDEX ix_messages_session_created ON app.messages(session_id, created_at);

-- REMINDERS
CREATE TABLE app.reminders (
  reminder_id   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES app.users(user_id) ON DELETE CASCADE,
  kind          varchar(50)  NOT NULL,
  schedule_cron varchar(120) NOT NULL,
  timezone      varchar(64)  NOT NULL DEFAULT 'America/New_York',
  is_active     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT ck_reminders_kind CHECK (kind IN ('daily_checkin','exercise','custom'))
);
CREATE INDEX ix_reminders_user_active ON app.reminders(user_id, is_active);

-- ---------- Seed data ----------
-- Users
WITH u AS (
  INSERT INTO app.users (email, display_name, hashed_password)
  VALUES
    ('alice@example.com','Alice','bcrypt_example_hash_for_alice'),
    ('bob@example.com','Bob','bcrypt_example_hash_for_bob')
  RETURNING user_id, email
),
t AS (
  INSERT INTO app.tags(name) VALUES ('gratitude'),('work'),('anxiety'),('family')
  ON CONFLICT (name) DO NOTHING
  RETURNING tag_id, name
)
SELECT 1;

-- Journals
DO $$
DECLARE
  uid_alice uuid;
  uid_bob   uuid;
  j1 uuid := gen_random_uuid();
  j2 uuid := gen_random_uuid();
  j3 uuid := gen_random_uuid();
BEGIN
  SELECT user_id INTO uid_alice FROM app.users WHERE email='alice@example.com';
  SELECT user_id INTO uid_bob   FROM app.users WHERE email='bob@example.com';

  INSERT INTO app.journals (journal_id, user_id, content, mood, created_at) VALUES
    (j1, uid_alice, 'Felt stressed before standup but a quick breathing exercise helped.', 4, now() - interval '1 day'),
    (j2, uid_alice, 'Grateful for a quiet walk after work.', 7, now()),
    (j3, uid_bob,   'Nervous about presentation; wrote an outline to prepare.', 5, now() - interval '2 days');

  INSERT INTO app.journal_tags(journal_id, tag_id)
    SELECT j1, tag_id FROM app.tags WHERE name IN ('work','anxiety');
  INSERT INTO app.journal_tags(journal_id, tag_id)
    SELECT j2, tag_id FROM app.tags WHERE name IN ('gratitude');
  INSERT INTO app.journal_tags(journal_id, tag_id)
    SELECT j3, tag_id FROM app.tags WHERE name IN ('work');
END $$;

-- Sessions + messages
DO $$
DECLARE
  uid_alice uuid := (SELECT user_id FROM app.users WHERE email='alice@example.com');
  uid_bob   uuid := (SELECT user_id FROM app.users WHERE email='bob@example.com');
  s1 uuid := gen_random_uuid();
  s2 uuid := gen_random_uuid();
BEGIN
  INSERT INTO app.sessions(session_id, user_id, session_type, started_at, ended_at)
  VALUES (s1, uid_alice, 'checkin', now() - interval '30 minutes', now());

  INSERT INTO app.messages(session_id, role, content, created_at) VALUES
    (s1, 'user',   'Mood: 4. Felt anxious this morning.', now() - interval '29 minutes'),
    (s1, 'mentor', 'Try a 2-minute box-breathing exercise. What''s one small step?', now() - interval '28 minutes'),
    (s1, 'user',   'I''ll write the agenda before standup.', now() - interval '27 minutes');

  INSERT INTO app.sessions(session_id, user_id, session_type, started_at)
  VALUES (s2, uid_bob, 'chat', now() - interval '3 hours');

  INSERT INTO app.messages(session_id, role, content, created_at) VALUES
    (s2, 'user',   'Can you help me reframe negative thoughts about my presentation?', now() - interval '3 hours'),
    (s2, 'mentor', 'Let''s list evidence for and against the thought.', now() - interval '3 hours');
END $$;

-- Reminders
INSERT INTO app.reminders(user_id, kind, schedule_cron, timezone, is_active)
SELECT user_id, 'daily_checkin', '0 30 21 * * *', 'America/New_York', true
FROM app.users WHERE email='alice@example.com';

INSERT INTO app.reminders(user_id, kind, schedule_cron, timezone, is_active)
SELECT user_id, 'exercise', '0 0 12 * * Mon,Wed,Fri', 'America/New_York', true
FROM app.users WHERE email='bob@example.com';

COMMIT;

-- Quick sanity checks
-- SELECT email, created_at FROM app.users;
-- SELECT count(*) FROM app.journals;
