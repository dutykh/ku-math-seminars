#!/bin/bash
#
# KU Math Seminars - deployment script
# Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
# License: GNU General Public License v3.0
#
# Triggered by webhook-server.js on a push to main, and safe to run by hand.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCK_FILE="${TMPDIR:-/tmp}/ku-math-seminars-deploy.lock"

# Serialize deployments. Two pushes in quick succession must not build into the
# same working tree at the same time.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another deployment is already running; aborting." >&2
  exit 1
fi

cd "$PROJECT_DIR"

echo "Starting deployment at $(date -Is)"
echo "Project directory: $PROJECT_DIR"

# Astro 6+ requires Node 22.12 or newer.
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
NODE_MINOR="$(node -p 'process.versions.node.split(".")[1]')"
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; }; then
  echo "Node $(node -v) is too old; Astro requires >= 22.12.0." >&2
  exit 1
fi

echo "Pulling latest changes from GitHub..."
git pull --ff-only origin main

# --frozen-lockfile: install exactly what the lockfile pins. A webhook must
# never be able to resolve new dependency versions on its own.
echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building project..."
ASTRO_TELEMETRY_DISABLED=1 pnpm run build

# Only touch this project's processes; the VPS runs other apps under the same
# PM2 daemon.
echo "Restarting PM2 processes for ku-math-seminars..."
pm2 restart "events-website" --update-env || echo "events-website not found; skipping"
pm2 restart "ku-math-seminars-webhook" --update-env || echo "ku-math-seminars-webhook not found; skipping"

echo "Deployment completed successfully at $(date -Is)"
