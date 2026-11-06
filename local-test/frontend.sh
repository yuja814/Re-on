#!/bin/zsh
set -euo pipefail
cd "${0:A:h}/.."
export BROWSER=none
exec npm run web -- --port 18092
