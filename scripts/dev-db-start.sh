#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Add it to .env first."
  exit 1
fi

mapfile -t db_parts < <(node <<'NODE'
const raw = process.env.DATABASE_URL
if (!raw) {
  console.error("DATABASE_URL is missing")
  process.exit(1)
}

const url = new URL(raw)
const username = decodeURIComponent(url.username || "")
const password = decodeURIComponent(url.password || "")
const host = url.hostname || "localhost"
const port = url.port || "5432"
const dbName = (url.pathname || "").replace(/^\//, "")

if (!username || !password || !dbName) {
  console.error("DATABASE_URL must include username, password, and database name")
  process.exit(1)
}

console.log(username)
console.log(password)
console.log(host)
console.log(port)
console.log(dbName)
NODE
)

DB_USER="${db_parts[0]}"
DB_PASSWORD="${db_parts[1]}"
DB_HOST="${db_parts[2]}"
DB_PORT="${db_parts[3]}"
DB_NAME="${db_parts[4]}"
CONTAINER_NAME="${YAIP_DB_CONTAINER_NAME:-yaip-postgres}"

if [[ "$DB_HOST" != "localhost" && "$DB_HOST" != "127.0.0.1" ]]; then
  echo "DATABASE_URL host is '$DB_HOST'. db:start only manages local Docker Postgres (localhost)."
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  docker start "$CONTAINER_NAME" >/dev/null
  echo "Started existing container '$CONTAINER_NAME' on localhost:$DB_PORT"
else
  docker run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT:5432" \
    postgres:16-alpine >/dev/null
  echo "Created and started '$CONTAINER_NAME' for database '$DB_NAME' on localhost:$DB_PORT"
fi
