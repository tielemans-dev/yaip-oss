#!/bin/sh
set -e

cd /app/apps/oss

echo "Running database migrations..."
bunx prisma migrate deploy

echo "Starting server..."
exec bun .output/server/index.mjs
