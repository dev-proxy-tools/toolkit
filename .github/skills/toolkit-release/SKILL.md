---
name: toolkit-release
description: Manage the Dev Proxy Toolkit VS Code extension release lifecycle. Covers preparing beta development cycles, creating beta (pre-release) releases, preparing and creating regular (stable) releases, version bumping, changelog management, and release notes generation. USE FOR: version bump, increment version, prepare beta, new beta version, bump version, create release, prepare release, publish release, release notes, changelog update, beta release, pre-release, stable release, regular release, prepare for next version, move to next version, ship release.
---

# Toolkit Release

Manage the release lifecycle for the Dev Proxy Toolkit VS Code extension.

## Context

- **Dev Proxy releases**: https://github.com/dotnet/dev-proxy/releases
- Even minor versions (1.12.0, 1.14.0) are regular/stable releases
- Odd minor versions (1.13.0, 1.15.0) are beta/pre-release versions
- Publishing is automated: creating a GitHub release triggers `.github/workflows/publish.yml`
  - Tag ending with `-beta` → `vsce publish --pre-release` → marketplace pre-release
  - Tag without `-beta` → `vsce publish` → marketplace stable release
- VS Code auto-updates users to the highest version, so the even/odd scheme ensures stable releases always have a higher minor than betas

## Determine Current State

Read `package.json` `version` field to determine where we are in the cycle:

- **Even minor** (e.g., 1.12.0): On a regular release. Next step is usually "Prepare Beta After Regular Release"
- **Odd minor, patch 0** (e.g., 1.13.0): Beta cycle started, no betas released yet
- **Odd minor, patch > 0** (e.g., 1.13.2): Beta(s) already released

## Workflow 1: Prepare Beta After Regular Release

Run after a regular release ships to start the next development cycle.

1. Run `npm version minor --no-git-tag-version` (bumps to next odd minor, e.g., 1.12.0 → 1.13.0)
2. Add changelog section in `CHANGELOG.md`: insert `## [X.Y.0] - Unreleased` on a blank line immediately after the `> **Note**:` blockquote and before the previous release heading
3. Update `README.md` Pre-release badge version to match new version (e.g., `Pre--release-v1.13.0`). The badge is on line 4, uses shields.io format with double dash for hyphenated words.
4. Commit: `git add package.json package-lock.json CHANGELOG.md README.md && git commit -m "Increment version to vX.Y.0"`
5. Push: `git push origin main` (confirm with user first)

## Workflow 2: Create Beta Release

Release a new beta to the VS Code Marketplace as a pre-release.

1. Read current version from `package.json` — this is the version to release (already set by Workflow 1 or a previous beta bump)
2. Ask the user for the target Dev Proxy version (e.g., "v2.2.0"). They know which Dev Proxy release this beta targets.
3. Push: `git push origin main` (confirm with user first)
4. Generate release notes from git log since last beta/release tag — see [release-notes-template.md](references/release-notes-template.md)
5. Update `README.md` Pre-release badge version to match the version being released (e.g., `Pre--release-v1.13.0`). The badge is on line 4, uses shields.io format with double dash for hyphenated words. This reflects what's published to the marketplace.
6. Create GitHub release:
   - Tag: `vX.Y.Z-beta` (e.g., `v1.13.0-beta` for first beta, `v1.13.2-beta` for subsequent)
   - Title: `vX.Y.Z-beta`
   - Mark as **pre-release**
   - Body: generated release notes
   - **Important**: Write release notes to a temp file and use `gh release create --notes-file <file>`. Do NOT use inline `--notes` — multi-line content gets garbled by the terminal.
7. Create or move `devproxy-vX.Y.Z` tag to this commit:
   - First beta in cycle: `git tag -m "Dev Proxy vX.Y.Z" devproxy-vX.Y.Z && git push origin devproxy-vX.Y.Z`
   - Subsequent beta: `git tag -f -m "Dev Proxy vX.Y.Z" devproxy-vX.Y.Z && git push origin devproxy-vX.Y.Z --force`
8. Bump version for next beta: `npm version patch --no-git-tag-version` (e.g., 1.13.0 → 1.13.1)
9. Update `CHANGELOG.md`: change the unreleased section header version to match the new version (e.g., `## [1.13.0] - Unreleased` → `## [1.13.1] - Unreleased`)
10. Commit: `git add package.json package-lock.json CHANGELOG.md README.md && git commit -m "Increment version to vX.Y.Z"`
11. Push: `git push origin main` (confirm with user first)
12. Clean up any temp files created during the workflow (e.g., release notes temp file)

## Workflow 3: Prepare Regular Release

Transition from beta to regular release when a new Dev Proxy version ships.

1. Run `npm version minor --no-git-tag-version` (bumps odd to even, e.g., 1.13.2 → 1.14.0)
2. Update `CHANGELOG.md`: change the unreleased section header from `## [1.13.0] - Unreleased` to `## [1.14.0] - YYYY-MM-DD` (today's date)
3. Update `README.md` Stable badge version to match new version (e.g., `Stable-v1.14.0`)
4. Verify all tests pass: `npm run compile && npm test`
5. Commit: `git add package.json package-lock.json CHANGELOG.md README.md && git commit -m "Increment version to vX.Y.0"`
6. Push: `git push origin main` (confirm with user first)

## Workflow 4: Create Regular Release

Create the stable GitHub release after preparing.

1. Generate release notes from git log for the full cycle — see [release-notes-template.md](references/release-notes-template.md). Regular release notes are **cumulative** (cover everything since the last regular release).
2. Create GitHub release:
   - Tag: `vX.Y.0` (e.g., `v1.14.0`)
   - Title: `vX.Y.0`
   - **Not** marked as pre-release
   - Body: cumulative release notes
3. Move `devproxy-vX.Y.Z` tag to the release commit:
   - `git tag -f -m "Dev Proxy vX.Y.Z" devproxy-vX.Y.Z && git push origin devproxy-vX.Y.Z --force`

## During Development

When adding features, updates, or fixes during a beta cycle:

- Update `CHANGELOG.md` under the current unreleased section:
  - New features under `### Added:`
  - Updated features under `### Changed:`
  - Bug fixes under `### Fixed:`
- Update `README.md` if adding user-facing features (not for bugs or internal changes)
- Ensure tests pass before merging

## Testing

All tests must pass before any release. The PR workflow (`.github/workflows/pr.yml`) runs tests on macOS, Ubuntu, and Windows.

Verify locally: `npm run compile && npm test`

## Key Files

| File | What to update |
|------|---------------|
| `package.json` | `version` field (via `npm version`) |
| `package-lock.json` | Updated automatically by `npm version` |
| `CHANGELOG.md` | Release entries, section headers |
| `README.md` | Version badges on line 4 |
| `.github/workflows/publish.yml` | Do not edit — automates marketplace publishing |

## Rules

- Do not modify files other than those listed above during release workflows
- Always confirm with the user before pushing to remote or creating GitHub releases
- Beta release notes are incremental (since last beta), regular release notes are cumulative (full cycle)
- The `devproxy-vX.Y.Z` tag version comes from the user — ask them, don't guess
- Do not bypass CI checks or use `--no-verify`
- Always use `--notes-file` (not `--notes`) when creating GitHub releases with `gh release create`
- Always use `-m "message"` when creating git tags — bare `git tag <name>` opens an editor and fails in automation
