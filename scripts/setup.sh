#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
DEFAULT_DB_URL='DATABASE_URL="file:./data/quiz.db"'

echo ">> Ensuring .env exists"
if [ ! -f "${ENV_FILE}" ]; then
  echo "${DEFAULT_DB_URL}" > "${ENV_FILE}"
  echo "Created .env with default SQLite DATABASE_URL"
elif ! grep -q "^DATABASE_URL=" "${ENV_FILE}"; then
  echo "${DEFAULT_DB_URL}" >> "${ENV_FILE}"
  echo "Added DATABASE_URL to existing .env"
else
  echo ".env already contains DATABASE_URL"
fi

echo ">> Installing npm dependencies"
npm install

echo ">> Creating data directory"
mkdir -p "${ROOT_DIR}/data"

echo ">> Applying database migrations"
if [ -d "${ROOT_DIR}/prisma/migrations" ] && [ "$(ls -A ${ROOT_DIR}/prisma/migrations)" ]; then
  echo "Migrations found, deploying..."
  npx prisma migrate deploy
else
  echo "No migrations found, creating initial migration..."
  npx prisma migrate dev --name init
fi

echo ">> Setup complete. Run: npm run dev"
