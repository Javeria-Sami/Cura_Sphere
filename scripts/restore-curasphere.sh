#!/usr/bin/env bash
# ==============================================================================
# CuraSphere Clinic Edition: Database Restore Utility
# Script: scripts/restore-curasphere.sh
# Purpose: Restores a PostgreSQL custom dump file with clean drop & schema restore
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <backup_file_path> [target_database_name]"
  exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${2:-${DB_NAME:-curasphere_db}}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "=========================================================="
echo " Starting CuraSphere Database Restore"
echo " Source Backup: ${BACKUP_FILE}"
echo " Target Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo " User: ${DB_USER}"
echo "=========================================================="

# Execute pg_restore with clean recreation
pg_restore \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --dbname="${DB_NAME}" \
  --clean \
  --if-exists \
  --verbose \
  --no-owner \
  --no-privileges \
  "${BACKUP_FILE}" || true

echo "=========================================================="
echo " Restore Operation Finished"
echo " Target DB: ${DB_NAME}"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================================="
