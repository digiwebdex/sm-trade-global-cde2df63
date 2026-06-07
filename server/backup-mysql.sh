#!/bin/bash
set -euo pipefail

ENV_FILE="/var/www/smtradeapp-soft/server/.env"
BACKUP_DIR="/var/backups/smtradeapp-soft/mysql"
LOG_FILE="/var/log/smtrade-soft-backup.log"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$BACKUP_DIR/smtradeapp_db_${TIMESTAMP}.sql.gz"

mysqldump \
  -h "${DB_HOST:-127.0.0.1}" \
  -P "${DB_PORT:-3306}" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --no-tablespaces \
  "$DB_NAME" 2>>"$LOG_FILE" | gzip > "$OUT_FILE"

if [ ! -s "$OUT_FILE" ]; then
  echo "[$(date)] FAIL empty backup for $DB_NAME" >> "$LOG_FILE"
  rm -f "$OUT_FILE"
  exit 1
fi

echo "[$(date)] OK $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))" >> "$LOG_FILE"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
