#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-8765}"
cd "$(dirname "$0")"

# Kill any process already listening on $PORT so re-runs always succeed.
# macOS / Linux both have lsof. Fall back to fuser if lsof is missing.
kill_port() {
  local p="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti tcp:"$p" 2>/dev/null || true)
  elif command -v fuser >/dev/null 2>&1; then
    pids=$(fuser -n tcp "$p" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' || true)
  fi
  if [ -n "$pids" ]; then
    echo "  Port $p in use by PID(s): $pids — killing." >&2
    kill $pids 2>/dev/null || true
    # Give the kernel a beat to release the socket.
    sleep 0.5
    # If anything's still hanging on, SIGKILL.
    if command -v lsof >/dev/null 2>&1; then
      pids=$(lsof -ti tcp:"$p" 2>/dev/null || true)
      if [ -n "$pids" ]; then
        kill -9 $pids 2>/dev/null || true
        sleep 0.3
      fi
    fi
  fi
}

echo "================================================"
echo "  Vitess Learning Tutorial"
echo "  http://localhost:$PORT"
echo "  Ctrl-C to stop."
echo "================================================"

kill_port "$PORT"

if command -v open >/dev/null 2>&1; then
  (sleep 1 && open "http://localhost:$PORT") &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 1 && xdg-open "http://localhost:$PORT") &
fi

exec python3 -m http.server "$PORT"
