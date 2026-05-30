#!/bin/sh
set -e

mkdir -p logs

until npx prisma db push; do
  echo "Database is unavailable, retrying in 3 seconds..."
  sleep 3
done

npm run db:seed

exec node dist/index.js
