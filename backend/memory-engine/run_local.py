"""Run the unchanged engine with the Core .env service secret, without printing it."""
from pathlib import Path
import os
import uvicorn

root = Path(__file__).resolve().parent
for line in (root.parent / ".env").read_text().splitlines():
    if line.startswith("REON_ENGINE_TOKEN="):
        os.environ.setdefault("REON_ENGINE_TOKEN", line.split("=", 1)[1])
if not os.environ.get("REON_ENGINE_TOKEN"):
    raise SystemExit("REON_ENGINE_TOKEN must be configured in backend/.env")
if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=18081, log_level="warning", access_log=False)
