#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Define la URL de PostgreSQL del proyecto EduKids de destino}"
if [ "${EDUKIDS_CONFIRM_MIGRATION:-}" != "APLICAR_EDUKIDS" ]; then
  echo "Revisa primero supabase-plan.sh y la guía. Para aplicar, define EDUKIDS_CONFIRM_MIGRATION=APLICAR_EDUKIDS."
  exit 1
fi
npx --no-install supabase db push --db-url "$SUPABASE_DB_URL"
