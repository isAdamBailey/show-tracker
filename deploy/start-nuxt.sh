#!/usr/bin/env bash
set -euo pipefail

# Forge runs this from the daemon's Directory, which should point through the
# site's `current` symlink. Keep secrets in the site's shared .env file rather
# than in the Supervisor command line.
SITE_ENV_FILE="${SITE_ENV_FILE:-/home/forge/show-tracker.adambailey.io/.env}"
PORT="${PORT:-3005}"

if [[ ! -r "$SITE_ENV_FILE" ]]; then
  echo "Nuxt daemon environment file is missing or unreadable: $SITE_ENV_FILE" >&2
  exit 1
fi

export PORT NITRO_HOST=127.0.0.1 NODE_ENV=production
exec node --env-file="$SITE_ENV_FILE" --require ./deploy/nuxt-runtime-env.cjs .output/server/index.mjs
