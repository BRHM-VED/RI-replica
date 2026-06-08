#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8787}"
# Kill any existing server on this port
lsof -ti:$PORT | xargs kill -9 2>/dev/null
python3 "$DIR/serve.py" $PORT
