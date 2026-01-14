# AGENTS.md - AI Assistant Instructions

This file provides instructions for AI coding assistants (GitHub Copilot, Claude, etc.) working on the Dev Proxy Toolkit VS Code extension.

## Quick Reference

```
src/
├── commands/        # Add new commands here (one file per feature group)
├── services/        # Business logic, API clients
├── constants/       # All IDs, keys, URLs (commands.ts)
├── data/            # Plugin metadata (plugins.json) - edit JSON, not code
├── utils/           # Pure helper functions
├── test/            # Tests split by domain (*.test.ts)
└── *.ts             # Core extension modules
```

## Common Tasks

### Adding a New Command

1. **Register the command ID** in `src/constants/commands.ts`:
   ```typescript
   export const Commands = {
     // ... existing
     MY_NEW_COMMAND: 'dev-proxy-toolkit.my-new-command',
   };
   ```

2. **Add to package.json** under `contributes.commands`:
   ```json
   {
     "command": "dev-proxy-toolkit.my-new-command",
     "title": "My New Command",
     "category": "Dev Proxy Toolkit"
   }
   ```

3. **Create/update command file** in `src/commands/`:
   ```typescript
   export function registerMyCommands(context: vscode.ExtensionContext) {
     context.subscriptions.push(
       vscode.commands.registerCommand(Commands.MY_NEW_COMMAND, async () => {
         // implementation
       })
     );
   }
   ```

4. **Register in `src/commands/index.ts`** if creating a new file.

5. **Add a test** in appropriate test file or create new `*.test.ts`.

### Adding a New Plugin

**No code changes needed!** Edit `src/data/plugins.json`:

```json
{
  "plugins": {
    "MyNewPlugin": {
      "configRequired": true,
      "configSection": "myNewPlugin",
      "configSnippet": "devproxy-plugin-my-new-config"
    }
  },
  "docs": {
    "MyNewPlugin": "https://..."
  }
}
```

### Adding a Diagnostic

1. Add diagnostic code to `DiagnosticCodes` in `src/constants/commands.ts`
2. Add diagnostic creation in `src/diagnostics.ts`
3. Add code action (quick fix) in `src/code-actions.ts`
4. Add test in `src/test/schema.test.ts` or `src/test/plugins.test.ts`

## Conventions

### File Naming
- Use **kebab-case** for all files: `my-feature.ts`, `my-feature.test.ts`
- Test files: `{feature}.test.ts` in `src/test/`

### Imports
- Use barrel exports from `index.ts` files:
  ```typescript
  import { Commands, DiagnosticCodes } from './constants';
  import { DevProxyApiClient } from './services';
  ```

### Testing
- Use helpers from `src/test/helpers.ts`:
  ```typescript
  import { getFixturePath, getExtensionContext, createDevProxyInstall } from './helpers';
  ```
- Fixtures go in `src/test/examples/`
- Each test file focuses on one domain

### Error Handling
- Use `vscode.window.showErrorMessage()` for user-facing errors
- Log to output channel for debugging

## Anti-Patterns (Don't Do This)

❌ **Don't hardcode command IDs** - use `Commands.*` from constants  
❌ **Don't inline plugin metadata** - edit `plugins.json` instead  
❌ **Don't create monolithic files** - split by feature/domain  
❌ **Don't skip tests** - at minimum test command registration  
❌ **Don't use `path.resolve(__dirname)` in tests** - use `getFixturePath()`  

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/extension.ts` | Entry point, activation |
| `src/constants/commands.ts` | All command IDs, context keys, URLs |
| `src/data/plugins.json` | Plugin metadata (editable without code) |
| `src/services/api-client.ts` | All Dev Proxy HTTP API calls |
| `src/test/helpers.ts` | Test utilities, mock factories |
| `package.json` | Command/menu contributions |

## Build & Test

```bash
npm run compile      # Build extension
npm test             # Run all tests
npm run lint         # Check for issues
npm run fix          # Auto-fix lint + format
```

## Dependencies

- **json-to-ast**: Parsing JSON for diagnostics (preserves locations)
- **semver**: Version comparison for upgrade checks
- **sinon**: Test mocking (devDependency)

## VS Code Extension Context

The extension uses these VS Code concepts:
- **Commands**: User actions (start, stop, etc.)
- **Diagnostics**: Squiggly lines in editor for config issues
- **CodeLens**: Inline "View docs" links on plugins
- **Code Actions**: Quick fixes for diagnostics
- **Task Provider**: Run Dev Proxy as VS Code task
- **Status Bar**: Shows Dev Proxy state (running, version)
- **MCP Server**: Model Context Protocol integration

## Questions?

Check `ARCHITECTURE.md` for detailed design decisions and module responsibilities.
