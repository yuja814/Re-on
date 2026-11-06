#!/bin/zsh
set -euo pipefail
cd "${0:A:h}/../backend/memory-engine"
exec .venv/bin/python -c 'from run_local import *; uvicorn.run("api:app", host="127.0.0.1", port=18091, log_level="warning", access_log=False)'
