#!/bin/bash
# Cleanup script to kill any stale processes on dev ports before starting
# This prevents "Address already in use" errors when restarting dev servers

# Dev server ports used by the monorepo:
# 8787 - worker (sync server)
# 8788 - auth-worker
# 9229 - worker inspector port
# 9230 - auth-worker inspector port
# 60001 - web (vite, but dynamic)
# 6006 - storybook

PORTS="8787 8788 9229 9230 6006"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Cleaning up port $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null
  fi
}

echo "Checking for stale processes on dev ports..."

for port in $PORTS; do
  cleanup_port $port
done

# Also kill any orphaned wrangler processes
wrangler_pids=$(pgrep -f "wrangler dev" 2>/dev/null)
if [ -n "$wrangler_pids" ]; then
  echo "Cleaning up orphaned wrangler processes (PIDs: $wrangler_pids)"
  echo "$wrangler_pids" | xargs kill -9 2>/dev/null
fi

echo "Port cleanup complete."
