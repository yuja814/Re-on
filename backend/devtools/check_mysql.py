"""Read-only MySQL connection and schema check. Never prints credentials."""
from pathlib import Path
import os, subprocess, tempfile, urllib.parse, sys

root = Path(__file__).resolve().parents[1]
values = {}
for line in (root / ".env").read_text().splitlines():
    if line.strip() and not line.lstrip().startswith("#") and "=" in line:
        name, value = line.split("=", 1)
        values[name.strip()] = value.strip()
for name in ("DB_URL", "DB_USERNAME", "DB_PASSWORD"):
    if name in os.environ:
        values[name] = os.environ[name]
if not all(values.get(name) for name in ("DB_URL", "DB_USERNAME", "DB_PASSWORD")):
    raise SystemExit("DB_URL, DB_USERNAME, DB_PASSWORD must be configured")
url = urllib.parse.urlsplit(values["DB_URL"].removeprefix("jdbc:"))
if url.scheme != "mysql" or not url.hostname or not url.path.strip("/"):
    raise SystemExit("Invalid DB_URL")
def escape(value):
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r")
fd, filename = tempfile.mkstemp(prefix="reon-mysql-check-", suffix=".cnf")
try:
    with os.fdopen(fd, "w") as file:
        config = "[client]\nhost=" + url.hostname + "\nport=" + str(url.port or 3306)
        config += '\nuser="' + escape(values["DB_USERNAME"]) + '"'
        config += '\npassword="' + escape(values["DB_PASSWORD"]) + '"\nprotocol=TCP\n'
        file.write(config)
    os.chmod(filename, 0o600)
    query = "SELECT DATABASE(), VERSION(); SHOW TABLES;"
    if "--counts" in sys.argv:
        for table in ("reon_users", "auth_sessions", "moments", "memories", "youtube_connections", "playlist_exports"):
            query += "SELECT '" + table + "', COUNT(*) FROM " + table + ";"
    result = subprocess.run(["mysql", "--defaults-extra-file=" + filename, "--connect-timeout=5",
                             "--batch", "--skip-column-names", url.path.strip("/"), "-e",
                             query], capture_output=True, text=True)
    print(result.stdout, end="")
    if result.returncode:
        error = result.stderr
        for name in ("DB_PASSWORD", "GOOGLE_CLIENT_SECRET", "YOUTUBE_API_KEY", "YOUTUBE_TOKEN_ENCRYPTION_KEY"):
            if values.get(name): error = error.replace(values[name], "[REDACTED]")
        print(error)
        raise SystemExit(result.returncode)
finally:
    os.unlink(filename)
