#!/bin/bash
# Legacy wrapper — use server/backup-mysql.sh (reads server/.env)
set -euo pipefail
exec /var/www/smtradeapp-soft/server/backup-mysql.sh
