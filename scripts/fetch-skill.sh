#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

rm -rf "$SCRIPT_DIR/../skills/dev-proxy"
npx gitload-cli https://github.com/dotnet/dev-proxy/tree/main/skills/dev-proxy -o "$SCRIPT_DIR/../skills/dev-proxy"
