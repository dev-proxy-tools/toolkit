# Release Notes Template

## Regular Release

Regular release notes are cumulative — cover everything since the last regular release. Group related features under descriptive subsections.

```
## New in vX.Y.Z

### ✨ New Features

[Subsection Name]

• Description of feature

### 🔄 Changes

• Description of change

### 🐛 Fixed

• Description of fix
```

## Beta Release

Beta release notes cover only changes since the last beta, not cumulative. No subsection grouping needed.

```
## New in vX.Y.Z

### ✨ New Features

• Description of feature

### 🔄 Changes

• Description of change

### 🐛 Fixed

• Description of fix
```

## Guidelines

- Generate from `git log --oneline` since the last release/beta tag
- Write from the user's perspective — what changed for them, not what code was modified
- Use backticks for setting names, snippet prefixes, diagnostic codes, and plugin names
- Only include sections that have entries
- Omit internal/dependency changes that don't affect users

## Example (v1.12.0 — Regular Release)

```
## New in v1.12.0

### ✨ New Features

New Setting

• `devProxyPath` — Custom path to Dev Proxy executable (uses auto-detection if empty)

Improved Detection

• Auto-detection fallback using login shell and common installation paths

New Snippets

• `devproxy-plugin-graph-connector-guidance` — GraphConnectorGuidancePlugin instance
• `devproxy-plugin-mock-stdio-response` — MockStdioResponsePlugin instance with config section
• `devproxy-plugin-mock-stdio-response-file` — MockStdioResponsePlugin mocks file with schema

Enhanced Diagnostics

• Clickable diagnostic codes that link to documentation
• `emptyUrlsToWatch` warning when urlsToWatch array is empty
• `pluginConfigOptional` info when plugin can be configured with optional config section
• `invalidConfigSectionSchema` warning when config section schema version doesn't match installed Dev Proxy
• `unknownConfigProperty` warning when config section has undefined properties
• `invalidConfigValue` error when config section property value doesn't match schema requirements

New Quick Fixes

• Add optional plugin configuration (adds configSection + config)
• Add missing config section when referenced but not defined
• Update config section schema version (single or all at once)
• Remove unknown config section properties

### 🔄 Changes

• All snippets updated to use `v2.1.0` schema
• Improved diagnostic highlighting to target specific nodes instead of entire objects
• All diagnostics now use unique codes for better identification
• Update schema action now supports all Dev Proxy file schemas, not just config files

### 🐛 Fixed

• AuthPlugin now shows documentation link and configuration diagnostics
• LanguageModelFailurePlugin no longer incorrectly warns about requiring language model
```
