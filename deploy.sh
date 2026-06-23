#!/bin/bash
# Deploy smtradeapp-soft (soft.smtradeint.com) on this VPS
set -euo pipefail

APP_DIR="/var/www/smtradeapp-soft"
PM2_NAME="smtrade-soft"
API_PORT="3002"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> Deploy smtradeapp-soft ($(date))"

if [ "${DEPLOY_PULL:-0}" = "1" ] && [ -d .git ]; then
  echo "==> Pull $BRANCH..."
  git fetch origin "$BRANCH"
  git checkout "$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" "origin/$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  echo "==> Deploy current workspace (set DEPLOY_PULL=1 to git pull first)"
fi

if [ -f server/.env ]; then
  cp server/.env "/root/.smtradeapp-soft_env_backup_$(date +%Y%m%d_%H%M).env"
fi

echo "==> Frontend install + build..."
npm install
npm run build

echo "==> Backend install..."
cd server
npm install --omit=dev
PUPPETEER_CACHE_DIR=.puppeteer-cache npx puppeteer browsers install chrome || true
cd "$APP_DIR"

echo "==> Restart PM2 ($PM2_NAME)..."
pm2 restart "$PM2_NAME" --update-env
pm2 save

echo "==> Reload Nginx..."
systemctl reload nginx

echo "==> Health check..."
sleep 2
curl -sf "http://127.0.0.1:${API_PORT}/api/health" | head -c 200 || echo "health check failed"
echo ""
curl -s -o /dev/null -w "Frontend: %{http_code}\n" -H "Host: soft.smtradeint.com" http://127.0.0.1/

echo "==> Deploy complete."
