"""Launch the integrated engine on Spring's default port, without logging secrets."""
from __future__ import annotations

import argparse
import os
from pathlib import Path
from collections.abc import MutableMapping

import uvicorn

ENGINE_DIR = Path(__file__).resolve().parent
DEFAULT_PORT = 18081


def load_token(env_file: Path, environ: MutableMapping[str, str] | None = None) -> None:
    """Read simple KEY=value Core .env entries; OS environment takes priority.

    Core's .env.example uses unquoted, single-line values. This is not a shell
    or general Java-properties parser. An OS token works without a .env file.
    """
    env = os.environ if environ is None else environ
    if "REON_ENGINE_TOKEN" not in env:
        try:
            lines = env_file.read_text(encoding="utf-8-sig").splitlines()
        except FileNotFoundError:
            lines = []
        except (OSError, UnicodeError):
            raise ValueError("Cannot read backend/.env; check file permissions and UTF-8 encoding.") from None
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith(("#", "!")):
                continue
            key, separator, value = stripped.partition("=")
            if separator and key.strip() == "REON_ENGINE_TOKEN":
                env[key.strip()] = value.strip()

    token = env.get("REON_ENGINE_TOKEN", "")
    if not token or any(not 33 <= ord(char) <= 126 for char in token):
        raise ValueError("Set REON_ENGINE_TOKEN to a non-empty printable ASCII value without spaces "
                         "in the OS environment or backend/.env. Use the same value for Spring.")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT,
                        help="Engine port (default: 18081); match Spring MEMORY_ENGINE_URL when changing it.")
    args = parser.parse_args(argv)
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    try:
        load_token(ENGINE_DIR.parent / ".env")
    except ValueError as error:
        raise SystemExit(str(error)) from None
    print(f"API Docs: http://127.0.0.1:{args.port}/docs", flush=True)
    uvicorn.run("api:app", app_dir=str(ENGINE_DIR), host="127.0.0.1", port=args.port,
                log_level="warning", access_log=False)


if __name__ == "__main__":
    main()
