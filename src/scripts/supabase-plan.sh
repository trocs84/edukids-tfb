#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Define la URL de PostgreSQL del proyecto EduKids de destino}"
npx --no-install supabase db push --db-url "$SUPABASE_DB_URL" --dry-run
