# Dev Proxy Toolkit - Architecture Guide

This document describes the architecture of the Dev Proxy Toolkit VS Code extension, designed to help LLMs and developers understand and maintain the codebase effectively.

## Overview

Dev Proxy Toolkit is a VS Code extension that provides tooling for [Dev Proxy](https://aka.ms/devproxy), a command-line tool for simulating API behaviors. The extension offers:

- IntelliSense and validation for configuration files
- Commands to start/stop/restart Dev Proxy
- Status bar integration showing Dev Proxy state
- Code actions for fixing common configuration issues
- Task provider for running Dev Proxy as a VS Code task

## Directory Structure

```
src/
├── commands/           # Command implementations (one file per group)
│   ├── index.ts        # Barrel export, registers all commands
│   ├── proxy.ts        # start, stop, restart
│   ├── recording.ts    # start/stop recording, raise mock
│   ├── config.ts       # open, create new config
│   ├── install.ts      # install, upgrade
│   ├── jwt.ts          # JWT generation
│   ├── discovery.ts    # URL discovery
│   └── docs.ts         # documentation, language model config
│
├── services/           # Business logic services
│   ├── index.ts        # Barrel export
│   ├── api-client.ts   # HTTP client for Dev Proxy API
│   └── terminal.ts     # Terminal management
│
├── constants/          # Static values and identifiers
│   ├── index.ts        # Barrel export
│   └── commands.ts     # Command IDs, context keys, URLs
│
├── data/               # Static data (editable without code changes)
│   ├── index.ts        # Data loading and typed exports
│   └── plugins.json    # Plugin metadata (snippets, docs URLs)
│
├── utils/              # Pure utility functions
│   ├── index.ts        # Barrel export
│   ├── ast.ts          # JSON AST manipulation
│   ├── config-detection.ts # Config file detection
│   └── shell.ts        # Shell command execution
│
├── test/               # Test files
│   ├── helpers.ts             # Test utilities (fixtures, mocks)
│   ├── extension.test.ts      # Extension activation, command registration
│   ├── config-detection.test.ts # isConfigFile tests
│   ├── plugins.test.ts        # Plugin diagnostics and code lens
│   ├── notifications.test.ts  # Install/upgrade notifications
│   ├── status-bar.test.ts     # Status bar display states
│   ├── schema.test.ts         # Schema version validation
│   ├── detect.test.ts         # Version extraction (pure functions)
│   └── examples/              # Test fixture files (JSON configs)
│
├── snippets/           # VS Code snippet definitions
│
├── extension.ts        # Entry point, activates the extension
├── types.ts            # TypeScript type definitions
├── enums.ts            # Enum definitions
├── detect.ts           # Dev Proxy installation detection
├── diagnostics.ts      # Diagnostic generation for config files
├── documents.ts        # Document event listeners
├── code-lens.ts        # CodeLens provider for plugins
├── code-actions.ts     # Quick fix code actions
├── status-bar.ts       # Status bar management
├── state.ts            # Extension state management
├── notifications.ts    # User notifications
├── mcp.ts              # MCP server registration
└── task-provider.ts    # Task provider for running Dev Proxy
```

## Key Design Decisions

### 1. Command Organization

Commands are split into logical groups (proxy, recording, config, etc.) with one file per group. This makes it easy to:
- Find and modify a specific command
- Add new commands to the appropriate group
- Understand command dependencies

### 2. Service Layer

Services encapsulate complex logic:
- **DevProxyApiClient**: All HTTP calls to the Dev Proxy API go through this client
- **TerminalService**: Terminal creation and management

### 3. Constants Registry

All magic strings are centralized in `src/constants/commands.ts`:
- Command IDs
- Context keys (for when clauses)
- Diagnostic codes
- External URLs

### 4. Plugin Data as JSON

Plugin metadata (snippets, documentation URLs) is stored in `src/data/plugins.json`. This allows:
- Easy updates when Dev Proxy adds new plugins
- Potential auto-generation from Dev Proxy schemas
- Clear separation of data from code

### 5. Utility Functions

Pure functions are organized by domain in `src/utils/`:
- **ast.ts**: JSON AST manipulation (no VS Code dependencies possible, but we need vscode.Range)
- **configDetection.ts**: Logic for detecting Dev Proxy config files
- **shell.ts**: Shell command execution, package manager operations

## Common Modification Patterns

### Adding a New Command

1. Create or update a file in `src/commands/`
2. Add the command ID to `src/constants/commands.ts`
3. Register in `package.json` under `contributes.commands`
4. Import and call the registration function in `src/commands/index.ts`

### Adding a New Plugin

1. Add entry to `src/data/plugins.json` in both `plugins` and `docs` sections
2. No code changes needed - the data is loaded at runtime

### Adding a New Diagnostic

1. Add the diagnostic code to `DiagnosticCodes` in `src/constants/commands.ts`
2. Add the diagnostic creation logic in `src/diagnostics.ts`
3. Add the code action (quick fix) in `src/codeactions.ts`

### Modifying Dev Proxy API Interactions

All API calls go through `DevProxyApiClient`. To add a new API endpoint:
1. Add a method to `src/services/api-client.ts`
2. Use it from command handlers

## Testing

Tests are organized by domain in `src/test/`:

| Test File | Coverage |
|-----------|----------|
| `extension.test.ts` | Extension activation, command registration |
| `config-detection.test.ts` | `isConfigFile()` detection logic |
| `plugins.test.ts` | Plugin diagnostics and CodeLens |
| `notifications.test.ts` | Install/upgrade notifications |
| `status-bar.test.ts` | Status bar display states |
| `schema.test.ts` | Schema version validation |
| `detect.test.ts` | Version extraction functions |
| `code-actions.test.ts` | Quick fix code actions |
| `commands.test.ts` | Command registration |
| `api-client.test.ts` | HTTP client (uses sinon stubs) |
| `terminal.test.ts` | Terminal service |
| `mcp.test.ts` | MCP server registration |
| `task-provider.test.ts` | Task provider |
| `ast.test.ts` | AST utilities |
| `shell.test.ts` | Shell utilities |
| `constants.test.ts` | Constants module |
| `data.test.ts` | Plugin data utilities |

The test suite:
- Uses VS Code's extension testing framework (`@vscode/test-cli`)
- Requires test fixture files in `src/test/examples/`
- Uses `src/test/helpers.ts` for shared utilities:
  - `getFixturePath(fileName)`: Resolves paths to test fixtures
  - `testDevProxyInstall`: Default mock installation state
  - `createDevProxyInstall(overrides)`: Factory for custom mock states
  - `getExtensionContext()`: Gets the activated extension context

Run tests with:
```bash
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
```

### Coverage Limitations

The coverage `exclude` option in `.vscode-test.mjs` does not work properly with source-mapped TypeScript files. This is a known issue in `@vscode/test-cli`:

- **Issue**: [vscode-test-cli not excluding files from coverage report](https://github.com/microsoft/vscode-test-cli/issues)
- **Root cause**: c8 applies excludes before source map remapping, so patterns like `**/test/**` don't match the remapped paths
- **Workaround needed**: Expose `excludeAfterRemap: true` option in c8 Report configuration

**Impact**: The `src/test/helpers.ts` file is included in coverage reports. Since this file is 100% covered by tests, it slightly inflates the overall coverage percentage by a few percent. This is a minor distortion and doesn't significantly affect the usefulness of coverage metrics.

## Build

The extension uses webpack for bundling:
```bash
npm run compile      # Development build
npm run package      # Production build
npm run watch        # Development with watch mode
```

## Key Types

- **DevProxyInstall**: State of Dev Proxy installation (version, running status)
- **PluginSnippets**: Plugin configuration for IntelliSense
- **PluginDocs**: Plugin documentation URLs

## VS Code Extension Concepts Used

- **Commands**: User-invokable actions
- **Diagnostics**: Problems shown in the editor
- **CodeLens**: Inline links in the editor
- **Code Actions**: Quick fixes for diagnostics
- **Task Provider**: Integration with VS Code's task system
- **Status Bar**: Extension state display
- **MCP Server**: Model Context Protocol integration
