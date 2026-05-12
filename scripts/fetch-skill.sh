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

# Clean existing skill directory
rm -rf "$ROOT_DIR/$TARGET_DIR"
mkdir -p "$ROOT_DIR/$TARGET_DIR/references"

BASE_URL="https://raw.githubusercontent.com/$REPO/$BRANCH/$SKILL_PATH"

# Download SKILL.md
curl -fsSL "$BASE_URL/SKILL.md" -o "$ROOT_DIR/$TARGET_DIR/SKILL.md"

# Download reference files
REFERENCES=(
  "analyze-api-usage.md"
  "best-practices.md"
  "ci-cd-integration.md"
  "configuration.md"
  "installation.md"
  "mock-api-responses.md"
  "plugin-catalog.md"
  "test-api-resilience.md"
  "test-llm-apps.md"
)

for ref in "${REFERENCES[@]}"; do
  curl -fsSL "$BASE_URL/references/$ref" -o "$ROOT_DIR/$TARGET_DIR/references/$ref"
done

echo "Dev Proxy skill fetched successfully."
