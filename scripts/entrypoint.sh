#!/bin/sh
set -e

cd /app

echo "[skatoday] applying migrations..."
node ./scripts/migrate.mjs || {
  echo "[skatoday] migrate falhou. abortando."
  exit 1
}

echo "[skatoday] seeding (idempotente)..."
node ./scripts/seed.mjs || echo "[skatoday] seed pulado"

echo "[skatoday] starting server on :3000"
exec node server.js
