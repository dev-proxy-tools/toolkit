# Dev Proxy Toolkit

<!-- Update version badges when releasing: Stable = last published release, Pre-release = current manifest version -->
[![Stable Version](https://img.shields.io/badge/Stable-v1.10.0-007ACC)](https://marketplace.visualstudio.com/items?itemName=garrytrinder.dev-proxy-toolkit) [![Pre-release Version](https://img.shields.io/badge/Pre--release-v1.11.0-24bfa5)](https://marketplace.visualstudio.com/items?itemName=garrytrinder.dev-proxy-toolkit) [![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/garrytrinder.dev-proxy-toolkit?label=Installs)](https://marketplace.visualstudio.com/items?itemName=garrytrinder.dev-proxy-toolkit)

[![Install Stable](https://img.shields.io/badge/VS%20Code-Install_Stable-007ACC?logo=visualstudiocode)](vscode:extension/garrytrinder.dev-proxy-toolkit) [![Install Pre-release](https://img.shields.io/badge/VS%20Code%20Insiders-Install_Pre--release-24bfa5?logo=visualstudiocode)](vscode-insiders:extension/garrytrinder.dev-proxy-toolkit)

Supercharge your [Dev Proxy](https://aka.ms/devproxy) workflow with IntelliSense, diagnostics, and one-click commands.

<!-- TODO: Add hero GIF showing extension in action -->

## Quick Start

1. **Install this extension** - [Install from VS Code](vscode:extension/garrytrinder.dev-proxy-toolkit). You'll be prompted to install Dev Proxy if it's not already installed.
2. **Create a config** - Run `Dev Proxy Toolkit: Create configuration file` from the Command Palette
3. **Configure your proxy** - Add URLs to watch and plugins using snippets (type `devproxy-`) or let [GitHub Copilot help](#mcp-server)
4. **Start Dev Proxy** - Run `Dev Proxy Toolkit: Start` from the Command Palette

## Features

### Commands

Control Dev Proxy directly from VS Code via the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).

| Command | When Available |
|---------|----------------|
| Start | Dev Proxy not running |
| Stop | Dev Proxy running |
| Restart | Dev Proxy running |
| Raise mock request | Dev Proxy running |
| Start recording | Dev Proxy running |
| Stop recording | Dev Proxy recording |
| Open configuration file | Dev Proxy installed |
| Create configuration file | Dev Proxy installed |
| Discover URLs to watch | Dev Proxy not running |
| Generate JWT | Dev Proxy installed |

### Snippets

Type `devproxy-` to access 80+ snippets:

- **JSON** - Config files, plugins, mocks, and more
- **YAML** - GitHub Actions workflow steps

<details>
<summary><strong>JSON Snippets</strong> (click to expand)</summary>

| Prefix | Description |
| ------ | ----------- |
| `devproxy-config-file` | Dev Proxy config file |
| `devproxy-config-file-schema` | Dev Proxy config file schema |
| `devproxy-error` | Dev Proxy error |
| `devproxy-mocks-file` | Dev Proxy mocks file |
| `devproxy-mocks-file-schema` | Dev Proxy mocks file schema |
| `devproxy-mock` | Dev Proxy mock |
| `devproxy-prices-file` | Dev Proxy prices file |
| `devproxy-price` | Dev Proxy price |
| `devproxy-request` | Dev Proxy request |
| `devproxy-response` | Dev Proxy response |
| `devproxy-response-header` | Dev Proxy response header |
| `devproxy-rewrite` | Dev Proxy rewrite |
| `devproxy-plugin-auth` | AuthPlugin instance |
| `devproxy-plugin-auth-config-apikey` | AuthPlugin API Key config section |
| `devproxy-plugin-auth-config-oauth2` | AuthPlugin OAuth2 config section |
| `devproxy-plugin-api-center-minimal-permissions` | ApiCenterMinimalPermissionsPlugin instance |
| `devproxy-plugin-api-center-minimal-permissions-config` | ApiCenterMinimalPermissionsPlugin config section |
| `devproxy-plugin-api-center-onboarding` | ApiCenterOnboardingPlugin instance |
| `devproxy-plugin-api-center-onboarding-config` | ApiCenterOnboardingPlugin config section |
| `devproxy-plugin-api-center-production-version` | ApiCenterProductionVersionPlugin instance |
| `devproxy-plugin-api-center-production-version-config` | ApiCenterProductionVersionPlugin config section |
| `devproxy-plugin-caching-guidance` | CachingGuidancePlugin instance |
| `devproxy-plugin-caching-guidance-config` | CachingGuidancePlugin config section |
| `devproxy-plugin-crud-api` | CrudApiPlugin instance |
| `devproxy-plugin-crud-api-config` | CrudApiPlugin config section |
| `devproxy-plugin-crud-api-file` | CrudApiPlugin API file |
| `devproxy-plugin-crud-api-file-schema` | CrudApiPlugin API file schema |
| `devproxy-plugin-crud-api-action` | CrudApiPlugin action |
| `devproxy-plugin-dev-tools` | DevToolsPlugin instance |
| `devproxy-plugin-dev-tools-config` | DevToolsPlugin config section |
| `devproxy-plugin-entra-mock-response` | EntraMockResponsePlugin instance |
| `devproxy-plugin-entra-mock-response-config` | EntraMockResponsePlugin config section |
| `devproxy-plugin-execution-summary` | ExecutionSummaryPlugin instance |
| `devproxy-plugin-execution-summary-config` | ExecutionSummaryPlugin config section |
| `devproxy-plugin-generic-random-error` | GenericRandomErrorPlugin instance |
| `devproxy-plugin-generic-random-error-config` | GenericRandomErrorPlugin config section |
| `devproxy-plugin-generic-random-error-file` | GenericRandomErrorPlugin errors file |
| `devproxy-plugin-generic-random-error-file-schema` | GenericRandomErrorPlugin errors file schema |
| `devproxy-plugin-graph-beta-support-guidance` | GraphBetaSupportGuidancePlugin instance |
| `devproxy-plugin-graph-client-request-id-guidance` | GraphClientRequestIdGuidancePlugin instance |
| `devproxy-plugin-graph-connector-guidance` | GraphConnectorGuidancePlugin instance |
| `devproxy-plugin-graph-minimal-permissions-guidance` | GraphMinimalPermissionsGuidancePlugin instance |
| `devproxy-plugin-graph-minimal-permissions-guidance-config` | GraphMinimalPermissionsGuidancePlugin config section |
| `devproxy-plugin-graph-minimal-permissions` | GraphMinimalPermissionsPlugin instance |
| `devproxy-plugin-graph-minimal-permissions-config` | GraphMinimalPermissionsPlugin config section |
| `devproxy-plugin-graph-mock-response` | GraphMockResponsePlugin instance |
| `devproxy-plugin-graph-mock-response-config` | GraphMockResponsePlugin config section |
| `devproxy-plugin-graph-random-error` | GraphRandomErrorPlugin instance |
| `devproxy-plugin-graph-random-error-config` | GraphRandomErrorPlugin config section |
| `devproxy-plugin-graph-sdk-guidance` | GraphSdkGuidancePlugin instance |
| `devproxy-plugin-graph-select-guidance` | GraphSelectGuidancePlugin instance |
| `devproxy-plugin-har-generator` | HarGeneratorPlugin instance |
| `devproxy-plugin-har-generator-config` | HarGeneratorPlugin config section |
| `devproxy-plugin-http-file-generator` | HttpFileGeneratorPlugin instance |
| `devproxy-plugin-http-file-generator-config` | HttpFileGeneratorPlugin config section |
| `devproxy-plugin-latency` | LatencyPlugin instance |
| `devproxy-plugin-latency-config` | LatencyPlugin config section |
| `devproxy-plugin-language-model-failure` | LanguageModelFailurePlugin instance |
| `devproxy-plugin-language-model-failure-config` | LanguageModelFailurePlugin config section |
| `devproxy-plugin-language-model-rate-limiting` | LanguageModelRateLimitingPlugin instance |
| `devproxy-plugin-language-model-rate-limiting-config` | LanguageModelRateLimitingPlugin config section |
| `devproxy-plugin-minimal-csom-permissions` | MinimalCsomPermissionsPlugin instance |
| `devproxy-plugin-minimal-csom-permissions-config` | MinimalCsomPermissionsPlugin config section |
| `devproxy-plugin-minimal-permissions` | MinimalPermissionsPlugin instance |
| `devproxy-plugin-minimal-permissions-config` | MinimalPermissionsPlugin config section |
| `devproxy-plugin-minimal-permissions-guidance` | MinimalPermissionsGuidancePlugin instance |
| `devproxy-plugin-minimal-permissions-guidance-config` | MinimalPermissionsGuidancePlugin config section |
| `devproxy-plugin-mock-generator` | MockGeneratorPlugin instance |
| `devproxy-plugin-mock-request` | MockRequestPlugin instance |
| `devproxy-plugin-mock-request-config` | MockRequestPlugin config section |
| `devproxy-plugin-mock-response` | MockResponsePlugin instance |
| `devproxy-plugin-mock-response-config` | MockResponsePlugin config section |
| `devproxy-plugin-mock-response-schema` | MockResponsePlugin schema |
| `devproxy-plugin-mock-stdio-response` | MockStdioResponsePlugin instance |
| `devproxy-plugin-mock-stdio-response-config` | MockStdioResponsePlugin config section |
| `devproxy-plugin-mock-stdio-response-file` | MockStdioResponsePlugin mocks file |
| `devproxy-plugin-mock-stdio-response-file-schema` | MockStdioResponsePlugin mocks file schema |
| `devproxy-plugin-odata-paging-guidance` | ODataPagingGuidancePlugin instance |
| `devproxy-plugin-graph-odsp-search-guidance` | ODSPSearchGuidancePlugin instance |
| `devproxy-plugin-openai-mock-response` | OpenAIMockResponsePlugin instance |
| `devproxy-plugin-openai-telemetry` | OpenAITelemetryPlugin instance |
| `devproxy-plugin-openai-telemetry-config` | OpenAITelemetryPlugin config section |
| `devproxy-plugin-openai-usage-debugging` | OpenAIUsageDebuggingPlugin instance |
| `devproxy-plugin-open-api-spec-generator` | OpenApiSpecGeneratorPlugin instance |
| `devproxy-plugin-open-api-spec-generator-config` | OpenApiSpecGeneratorPlugin config section |
| `devproxy-plugin-rate-limiting` | RateLimitingPlugin instance |
| `devproxy-plugin-rate-limiting-config` | RateLimitingPlugin config section |
| `devproxy-plugin-rate-limiting-file` | Dev Proxy rate limiting file |
| `devproxy-plugin-rate-limiting-file-schema` | Dev Proxy rate limiting file schema |
| `devproxy-plugin-retry-after` | RetryAfterPlugin instance |
| `devproxy-plugin-rewrite` | RewritePlugin instance |
| `devproxy-plugin-rewrite-file` | RewritePlugin rewrites file |
| `devproxy-plugin-rewrite-file-schema` | RewritePlugin rewrites file schema |
| `devproxy-plugin-rewrite-config` | RewritePlugin config section |
| `devproxy-plugin-typespec-generator` | TypeSpecGeneratorPlugin instance |
| `devproxy-plugin-typespec-generator-config` | TypeSpecGeneratorPlugin config section |
| `devproxy-plugin-url-discovery` | UrlDiscoveryPlugin instance |
| `devproxy-reporter-json` | JsonReporter instance |
| `devproxy-reporter-markdown` | MarkdownReporter instance |
| `devproxy-reporter-plain-text` | PlainTextReporter instance |
| `devproxy-task-start` | Start Dev Proxy VS Code Task |
| `devproxy-task-stop` | Stop Dev Proxy VS Code Task |

</details>

<details>
<summary><strong>YAML Snippets</strong> (click to expand)</summary>

| Prefix | Description |
| ------ | ----------- |
| `devproxy-action-setup` | GitHub Actions step: Setup Dev Proxy (recommended) |
| `devproxy-action-start` | GitHub Actions step: Start Dev Proxy manually |
| `devproxy-action-stop` | GitHub Actions step: Stop Dev Proxy |
| `devproxy-action-record-start` | GitHub Actions step: Start Dev Proxy recording |
| `devproxy-action-record-stop` | GitHub Actions step: Stop Dev Proxy recording |
| `devproxy-action-chromium-cert` | GitHub Actions step: Install Dev Proxy certificate for Chromium browsers |

</details>

### Diagnostics

Real-time validation of your configuration files. Click any diagnostic code to view [detailed documentation](https://learn.microsoft.com/microsoft-cloud/dev/dev-proxy/technical-reference/toolkit-diagnostics).

| Code | Description |
|------|-------------|
| `invalidSchema` | Schema version doesn't match installed Dev Proxy |
| `invalidConfigSection` | Config section not used by any plugin |
| `deprecatedPluginPath` | Using old plugin DLL path (pre-v0.29) |
| `missingLanguageModel` | Plugin requires language model configuration |
| `noEnabledPlugins` | No plugins are enabled |
| `reporterPosition` | Reporter plugin should be last |
| `summaryWithoutReporter` | Summary plugin needs a reporter |
| `apiCenterPluginOrder` | OpenApiSpecGeneratorPlugin must come before ApiCenterOnboardingPlugin |
| `emptyUrlsToWatch` | No URLs configured to intercept |
| `pluginConfigRequired` | Plugin requires a config section |
| `pluginConfigMissing` | Referenced config section doesn't exist |
| `pluginConfigOptional` | Plugin can be configured (optional) |
| `pluginConfigNotRequired` | Plugin doesn't support configuration |

### Quick Fixes

One-click fixes for common issues:

- **Update schema** - Match schema to installed Dev Proxy version
- **Update plugin path** - Fix deprecated `dev-proxy-plugins.dll` paths (single or all at once)
- **Add languageModel configuration** - Enable language model for AI plugins
- **Add plugin configuration** - Add optional config section for plugins that support it
- **Add missing config section** - Create config section when plugin references one that doesn't exist

### Code Lens

- **View docs** - Click plugin names to open documentation

### Status Bar

Shows Dev Proxy status at a glance:

- Version number and update availability
- Running state (radio tower icon when active)
- Error indicator if Dev Proxy is not installed

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dev-proxy-toolkit.version` | `stable` \| `beta` | `stable` | Version to use when both are installed |
| `dev-proxy-toolkit.newTerminal` | `boolean` | `true` | Start Dev Proxy in a new terminal |
| `dev-proxy-toolkit.showTerminal` | `boolean` | `true` | Show terminal when starting |
| `dev-proxy-toolkit.closeTerminal` | `boolean` | `true` | Close terminal when stopping |
| `dev-proxy-toolkit.apiPort` | `number` | `8897` | Port for Dev Proxy API communication |

## Tasks

Run Dev Proxy as a VS Code task for integration with build workflows.

> [!TIP]
> Use the `devproxy-task-start` and `devproxy-task-stop` snippets to quickly add tasks to your `tasks.json`.

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Proxy",
      "type": "devproxy",
      "command": "start",
      "isBackground": true,
      "problemMatcher": "$devproxy-watch"
    },
    {
      "label": "Stop Dev Proxy",
      "type": "devproxy",
      "command": "stop"
    }
  ]
}
```

## MCP Server

This extension includes an MCP server for AI-assisted development. See [Dev Proxy MCP Server](https://github.com/dev-proxy-tools/mcp) for available tools.

## Troubleshooting

**Dev Proxy not detected?**
- Ensure Dev Proxy is installed and available in your PATH
- Check the `dev-proxy-toolkit.version` setting if you have both stable and beta installed

**Diagnostics not showing?**
- Verify your file is recognized as a Dev Proxy config (check the status bar)
- The file must be named `devproxyrc.json` or contain a valid `$schema` property

**Commands not available?**
- Some commands are only available when Dev Proxy is running or stopped
- Check the status bar to see the current state

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/dev-proxy-tools/toolkit/issues).

## License

[MIT](LICENSE)
