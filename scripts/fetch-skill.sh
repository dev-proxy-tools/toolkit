#!/usr/bin/env bash
set -euo pipefail

# Downloads the Dev Proxy skill from dotnet/dev-proxy main branch.
# The skill files (SKILL.md + references/) are fetched into skills/dev-proxy/
# and are .gitignored — they're bundled into the VSIX at build time.

REPO="dotnet/dev-proxy"
BRANCH="main"
SKILL_PATH="skills/dev-proxy"
TARGET_DIR="skills/dev-proxy"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Fetching Dev Proxy skill from $REPO@$BRANCH..."

# Ensure gitload-cli is available
if ! command -v gitload &> /dev/null; then
  echo "Installing gitload-cli..."
  npm install -g gitload-cli || { echo "Failed to install gitload-cli"; exit 1; }
fi

# Clean existing skill directory
rm -rf "$ROOT_DIR/$TARGET_DIR"

# Download skill folder using gitload-cli
gitload "https://github.com/$REPO/tree/$BRANCH/$SKILL_PATH" -o "$ROOT_DIR/$TARGET_DIR" || { echo "Failed to download skill using gitload-cli"; exit 1; }

echo "Dev Proxy skill fetched successfully."
