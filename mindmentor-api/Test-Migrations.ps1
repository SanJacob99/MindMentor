param(
  [string]$PgBin = "C:\Program Files\PostgreSQL\17\bin",   # adjust if needed
  [string]$Server = "localhost",
  [string]$Superuser = "postgres",
  [string]$SuperPass = "Br1llongo?",
  [string]$AppUser = "mindmentor",
  [string]$TestDb = "midmentor_test"
)

$ErrorActionPreference = "Stop"
$psql = Join-Path $PgBin "psql.exe"

# 0) Create fresh test DB
$env:PGPASSWORD = $SuperPass
& $psql -U $Superuser -h $Server -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $TestDb;"
& $psql -U $Superuser -h $Server -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $TestDb;"

# 1) Let app role create schema; precreate schema + extension owned by app role
& $psql -U $Superuser -h $Server -d $TestDb -v ON_ERROR_STOP=1 -c "GRANT CONNECT, CREATE ON DATABASE $TestDb TO $AppUser;"
& $psql -U $Superuser -h $Server -d $TestDb -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION $AppUser;"
& $psql -U $Superuser -h $Server -d $TestDb -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pgcrypto; ALTER EXTENSION pgcrypto OWNER TO $AppUser;"

# 2) Run Alembic UP on the test DB (don’t touch your real .env)
$env:MIGRATIONS_DATABASE_URL = "postgresql+asyncpg://$AppUser:ChangeMe_123@$Server:5432/$TestDb"
alembic upgrade head

# 3) Verify tables & a couple of critical columns exist
& $psql -U $AppUser -h $Server -d $TestDb -v ON_ERROR_STOP=1 -c "SELECT tablename FROM pg_tables WHERE schemaname='app' ORDER BY tablename;"
& $psql -U $AppUser -h $Server -d $TestDb -v ON_ERROR_STOP=1 -c "SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='users' ORDER BY column_name;"
& $psql -U $AppUser -h $Server -d $TestDb -v ON_ERROR_STOP=1 -c "SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='journals' ORDER BY column_name;"

# 4) Downgrade one step and re-upgrade (basic rollback/forward test)
alembic downgrade -1
alembic upgrade head

Write-Host "`nMigrations validated on $TestDb successfully." -ForegroundColor Green

# 5) (Optional) Drop test DB
# & $psql -U $Superuser -h $Server -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE $TestDb;"
