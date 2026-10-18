#!/usr/bin/env bash
# ==============================================================================
# CuraSphere Clinic Edition: Database Backup Utility
# Script: scripts/backup-curasphere.sh
# Purpose: Generates a compressed, timestamped PostgreSQL logical backup
# ==============================================================================
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-curasphere_db}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/curasphere_backup_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "=========================================================="
echo " Starting CuraSphere Database Backup"
echo " Target Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo " Output Destination: ${BACKUP_FILE}"
echo "=========================================================="

# Execute pg_dump in custom directory/tar format with maximum compression
pg_dump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_FILE}" \
  "${DB_NAME}"

BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "=========================================================="
echo " Backup Completed Successfully!"
echo " File: ${BACKUP_FILE}"
echo " Size: ${BACKUP_SIZE}"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================================="
