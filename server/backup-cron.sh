#!/bin/bash
# Legacy wrapper — use backup-mysql.sh (reads .env in same directory)
set -euo pipefail
exec "$(dirname "$0")/backup-mysql.sh"
