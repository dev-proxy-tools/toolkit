---
name: version-bump
description: Bump the extension to the next minor beta version for development. Increments the minor version in package.json, package-lock.json, and adds a new unreleased changelog section. USE FOR: version bump, increment version, prepare beta, new beta version, start new version, bump minor version, prep for new features.
---

# Version Bump

Increment the extension's minor version for a new beta development cycle.

## Workflow

1. **Read current version** from `package.json` (`version` field). Parse as `major.minor.patch`.
2. **Compute new version**: increment `minor` by 1, reset `patch` to 0. Example: `1.12.0` → `1.13.0`.
3. **Update version in three places**:
   - `package.json` — `"version"` field
   - `package-lock.json` — top-level `"version"` field AND the `packages[""]` → `"version"` field (two occurrences total)
4. **Add changelog section** in `CHANGELOG.md`: insert `## [{new version}] - Unreleased` on a blank line immediately after the `> **Note**:` blockquote and before the previous release heading.
5. **Commit**: `git add package.json package-lock.json CHANGELOG.md && git commit -m "Increment version to v{new version}"`
6. **Push**: ask the user for confirmation, then `git push origin main`.

## Rules

- Odd minor versions are beta/test versions (per the changelog note). This is expected.
- Do not modify any other files.
- Do not run `npm install` — edit `package-lock.json` directly to keep the lockfile version consistent.
- Always confirm before pushing to remote.
