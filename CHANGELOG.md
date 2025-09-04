# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: odd version numbers, for example, `0.13.0`, are not included in this changelog. They are used to test the new features and fixes before the final release.

## [1.2.0] - 2025-09-04

### Added:

- Snippets: Added `devproxy-action-setup` - GitHub Actions step: Setup Dev Proxy (recommended)
- Snippets: Added `devproxy-action-start` - GitHub Actions step: Start Dev Proxy manually
- Snippets: Added `devproxy-action-stop` - GitHub Actions step: Stop Dev Proxy
- Snippets: Added `devproxy-action-record-start` - GitHub Actions step: Start Dev Proxy recording
- Snippets: Added `devproxy-action-record-stop` - GitHub Actions step: Stop Dev Proxy recording
- Snippets: Added `devproxy-action-chromium-cert` - GitHub Actions step: Install Dev Proxy certificate for Chromium browsers

### Changed:

- Snippets: All snippets that reference schemas updated to use `v1.1.0` schema
- Updated package repository URL to reflect migration to dev-proxy-tools organisation

## [1.0.2] - 2025-07-06

### Added:

- Code actions: Support for JSONC files
- Code lens: Support for JSONC files
- Diagnostics: Added warnings for plugins that require `languageModel.enabled: true` when not configured
- Code actions: Added quick-fix to automatically add or update `languageModel.enabled: true` configuration
- Commands: Added `dev-proxy-toolkit.addLanguageModelConfig` command to add language model configuration
- Plugin constants: Added `requiresLanguageModel` property to identify plugins requiring language model functionality
- Snippets: Added `devproxy-plugin-language-model-failure` - LanguageModelFailurePlugin instance
- Snippets: Added `devproxy-plugin-language-model-failure-config` - LanguageModelFailurePlugin config section
- Snippets: Added `devproxy-plugin-language-model-rate-limiting` - LanguageModelRateLimitingPlugin instance
- Snippets: Added `devproxy-plugin-language-model-rate-limiting-config` - LanguageModelRateLimitingPlugin config section

### Changed:

- Snippets: All snippets that reference schemas updated to use `v1.0.0` schema
- Commands: `dev-proxy-toolkit.config-new` now creates the configuration file in the `.devproxy` folder and creates the folder if it does not exist
- Install: Updated winget package identifiers

### Fixed:

- Runtime error: Fixed issue where the extension would throw an uncaught exception when running

## [0.27.0] - 2025-06-30

### Added:

- Task provider: Added `devproxy` task provider to run Dev Proxy commands
- Problem watcher: Added `$devproxy-watch`
- Snippets: Added `devproxy-task-start` - Start Dev Proxy VS Code Task
- Snippets: Added `devproxy-task-stop` - Stop Dev Proxy VS Code Task

## [0.26.3] - 2025-06-27

### Fixed:

- Commands: Fixed issue where brew update output would be shown in a notification when upgrading Dev Proxy via homebrew

## [0.26.2] - 2025-06-27

### Changed:

- Snippets: Updated all snippets to use `v0.29.2` schema

## [0.26.1] - 2025-06-27

### Fixed:

- Notification: Fixed issue where upgrade notification would show when latest version is already installed

## [0.26.0] - 2025-06-26

### Added:

- MCP Server: Dev Proxy
- Diagnostics: Show error if pluginPath in plugin instance is not correctly set to DevProxy.Plugins.dll when using Dev Proxy v0.29.0 or later
- Code action: Update single or all plugin paths to DevProxy.Plugins.dll
- Command: `dev-proxy-toolkit.jwt-create` - Generate JWT with guided input for testing purposes

### Changed:

- Snippets: Updated all snippets to use `v0.29.0` schema
- Snippets: Updated all snippets to use new DLL name, `DevProxy.Plugins.dll`
- Notification: Upgrade notification invokes package manager to upgrade Dev Proxy
- Improved diagnostics range detection to ensure that they only appear againt the relevant code and don't overlap with ending quotes and commas
- Detection: Changed isDevProxyRunning check to use Dev Proxy API instead of process detection

### Fixed:

- Detection: Improved new version detection logic to resolve issue where toast notification would output irrelevant information

## [0.24.0] - 2025-06-04

### Added:

- Support for using Dev Proxy Beta with commands
- Command: `dev-proxy-toolkit.discover-urls-to-watch` - Start Dev Proxy in discovery mode
- Snippets: Added `devproxy-plugin-openai-telemetry` - OpenAITelemetryPlugin instance
- Snippets: Added `devproxy-plugin-openai-telemetry-config` - OpenAITelemetryPlugin config section
- Snippets: Added `devproxy-plugin-prices-file` - OpenAITelemetryPlugin telemetry prices file
- Snippets: Added `devproxy-plugin-price` - OpenAITelemetryPlugin telemetry model price

### Changed:

- Snippets: Updated all snippets to use `v0.28.0` schema
- Commands: Removed configuration commands from editor
- Detection: Improved detection of Dev Proxy processes

### Fixed:

- Detection: Fixed issue with version not showing correctly when log level set lower than information
- Diagnostics: Fixed issue with problems not being removed when file has been deleted

## [0.22.1] - 2025-05-02

### Added:

- Command: `dev-proxy-toolkit.config-new` - Create new configuration file
- Command: `dev-proxy-toolkit.restart` - Restart Dev Proxy
- Snippets: `devproxy-plugin-typespec-generator` - TypeSpecGeneratorPlugin instance
- Snippets: `devproxy-plugin-typespec-generator-config` - TypeSpecGeneratorPlugin config section
- MCP Server: Dev Proxy

### Changed:

- Snippets: Updated all snippets to use `v0.27.0` schema

### Fixed:

- Command: Using `dev-proxy-toolkit.start` would throw an error when active file is not a Dev Proxy config file

## [0.20.0] - 2025-04-01

### Added:

- Command: `dev-proxy-toolkit.config-open` - Open configuration file
- Snippets: `devproxy-plugin-minimal-csom-permissions` - MinimalCsomPermissionsPlugin instance
- Snippets: `devproxy-plugin-minimal-csom-permissions-config` - MinimalCsomPermissionsPlugin config section
- Snippets: `devproxy-plugin-minimal-permissions-guidance` - MinimalPermissionsGuidancePlugin instance
- Snippets: `devproxy-plugin-minimal-permissions-guidance-config` - MinimalPermissionsGuidancePlugin config section

### Changed:

- Command: Refactored stop command logic
- Diagnostics: Changed check to ensure at least one plugin from Error to Warning
- Command: `dev-proxy-toolkit.raise-mock` refactored to use new API endpoint
- Snippets: Updated all snippets to use `v0.26.0` schema

## [0.18.3] - 2025-03-03

### Added:

- Snippets: `devproxy-plugin-rewrite` - Dev Proxy rewrite
- Snippets: `devproxy-plugin-rewrite-file` - RewritePlugin rewrites file
- Snippets: `devproxy-plugin-rewrite-file-schema` - RewritePlugin rewrites file schema
- Diagnostics: Show warning if config contains a summary plugin without a reporter
- Diagnostics: Show warning if OpenApiSpecGeneratorPlugin is placed after ApiCenterOnboardingPlugin

### Changed: 

- Snippets: Updated schema urls to reflect the move to dotnet organisation in Github
- Snippets: All snippets that reference schemas updated to use `v0.25.0` schema
- Code action: Updated update schema code action to reflect the move to dotnet organisation in Github
- Snippets: `rate` property added to `devproxy-plugin-generic-random-error-config` and `devproxy-plugin-graph-random-error-config`
- Snippets: `$schema` property added to all config section snippets

### Fixed: 

- Diagnostics: Fixed GraphMockResponsePlugin does not require a config section issue
- Diagnostics: Fixed languageModel property being reported as invalid config section
- Install: Fixed broken link for Linux
- Install: Updated brew tap command to reference new tap location
- Install: Fixed incorrect homebrew formulae name
- Commands: Fixed issue with stop command not waiting to ensure Dev Proxy process has fully stopped before disposing of terminal

## [0.16.0] - 2025-02-03

### Added:

- Diagnostics: Ensure at least one plugin is enabled
- Diagnostics: Information added to pluginName value when plugin can be configured with a configSection
- Diagnostics: Warning added to config sections not connected to a plugin
- Snippets: `devproxy-plugin-url-discovery` - UrlDiscoveryPlugin instance

### Changed:

- Snippets: `devproxy-plugin-open-api-spec-generator` - OpenApiSpecGeneratorPlugin config section
- Snippets: All snippets that reference schemas updated to use `v0.24.0` schema
- Diagnostics: Refactored code to be more readable and maintainable
- Diagnostics: Improved config section check
- Snippets: Optional config sections removed from snippets
- Snippets: `specFormat` property added to `devproxy-plugin-open-api-spec-generator-config`

### Fixed:

- Snippets: Fix invalid Json in `devproxy-config-file`
- Diagnostics: Fixed update schema check in proxy files

## [0.14.0] - 2024-11-27

### Added:

- Snippets: `devproxy-plugin-rewrite` - RewritePlugin instance
- Snippets: `devproxy-plugin-rewrite-config` - RewritePlugin config section

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.23.0` schema

## [0.12.0] - 2024-10-31

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.22.0` schema
- Snippets: Added `logLevel`, `newVersionNotification`, `showSkipMessages` properties to `devproxy-config-file`
- Snippets: Renamed `devproxy-plugin-minimal-permissions` to `devproxy-plugin-graph-minimal-permissions`
- Snippets: Renamed `devproxy-plugin-minimal-permissions-guidance` to `devproxy-plugin-graph-minimal-permissions-guidance`
- Updated dependencies

### Added:

- Snippets: `devproxy-plugin-minimal-permissions-guidance-config` - MinimalPermissionsGuidancePlugin config section
- Snippets: `devproxy-plugin-minimal-permissions` - MinimalPermissionsPlugin instance

## [0.10.0] - 2024-10-01

### Added:

- Editor action: Start Dev Proxy
- Editor action: Stop Dev Proxy
- Editor action: Raise Mock Request
- Editor action: Start Recording
- Editor action: Stop Recording
- Command: `dev-proxy-toolkit.start` - Starts Dev Proxy
- Command: `dev-proxy-toolkit.stop` - Stops Dev Proxy
- Command: `dev-proxy-toolkit.raise-mock` - Raises a mock request
- Command: `dev-proxy-toolkit.record-start` - Starts recording Dev Proxy traffic
- Command: `dev-proxy-toolkit.record-stop` - Stops recording Dev Proxy traffic
- Setting: `dev-proxy-toolkit.newTerminal` - Determines if a new terminal should be created when starting Dev Proxy
- Setting: `dev-proxy-toolkit.showTerminal` - Determines if the terminal should be shown when starting Dev Proxy
- Setting: `dev-proxy-toolkit.closeTerminal` - Determines if the terminal should be closed when stopping Dev Proxy
- Setting: `dev-proxy-toolkit.apiPort` - Port number used to communicate with Dev Proxy API
- Diagnostics: Collection renamed to `dev-proxy-toolkit`
- Snippets: Support for JSONC (JSON with Comments) files
- Snippets: `devproxy-plugin-graph-minimal-permissions-guidance-config` - MinimalPermissionsGuidancePlugin config section
- Snippets: `devproxy-error` - Dev Proxy error
- Snippets: `devproxy-auth-plugin` - AuthPlugin instance
- Snippets: `devproxy-plugin-auth-config-apikey` - AuthPlugin API Key config section
- Snippets: `devproxy-plugin-auth-config-oauth2` - AuthPlugin OAuth2 config section

### Changed:

- Setting: `devproxytoolkit.versionPreference` renamed to `dev-proxy-toolkit.version`
- Workflow: Updated publish workflow to publish pre-release versions to marketplace

### Fixed:

- Code Lens: Fixed issue with documentation link shown for plugins with invalid names
- Snippets: `devproxy-plugin-generic-random-error-file` changed to match schema
- Readme: Updated information block to use correct formatting

## [0.8.0] - 2024-09-06

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.20.1` schema

## [0.7.1] - 2024-09-03

### Fixed:

- Snippets: Fix invalid schema URLs

## [0.7.0] - 2024-08-28

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.20.0` schema

## [0.6.0] - 2024-07-11

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.19.1` schema
- Snippets: Removed `configSection` from `devproxy-plugin-graph-minimal-permissions`
- Snippets: Updated `configSection` names to be unique

### Removed:

- Snippets: `devproxy-plugin-graph-minimal-permissions-config`

### Added:

- Snippet: `devproxy-plugin-graph-mock-response-config` - GraphMockResponsePlugin config section

## [0.5.0] - 2024-06-27

### Added:

- Snippets: `devproxy-plugin-api-center-minimal-permissions` - ApiCenterMinimalPermissionsPlugin instance
- Snippets: `devproxy-plugin-api-center-minimal-permissions-config` - ApiCenterMinimalPermissionsPlugin config section
- Snippets: `devproxy-plugin-http-file-generator` - HttpFileGeneratorPlugin instance
- Snippets: `devproxy-plugin-http-file-generator-config` - HttpFileGeneratorPlugin config section
- Snippets: `devproxy-plugin-openai-mock-response` - OpenAIMockResponsePlugin instance
- CodeLens: `ApiCenterMinimalPermissionsPlugin`
- CodeLens: `HttpFileGeneratorPlugin`
- CodeLens: `OpenAIMockResponsePlugin`
- File Diagnostic: Check that schema matches installed version of Dev Proxy expanded to all files

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.19.0` schema

### Fixed:

- Snippets: Removed `configSection` from `devproxy-plugin-graph-minimal-permissions-guidance`

### Removed:

- Snippets: `devproxy-plugin-graph-minimal-permissions-guidance-config`

## [0.4.0] - 2024-05-30

### Added:

- Snippet: `devproxy-reporter-json` - JsonReporter instance
- Snippet: `devproxy-reporter-markdown` - MarkdownReporter instance
- Snippet: `devproxy-reporter-plain-text` - PlainTextReporter instance
- CodeLens: `JsonReporter`
- CodeLens: `MarkdownReporter`
- CodeLens: `PlainTextReporter`
- Config diagnostic: Show warning if plugins follow a reporter in the plugins array

### Changed:

- Notification: Support for installing Dev Proxy via package manager when not installed
- Snippets: All snippets that reference schemas updated to use `v0.18.0` schema

## [0.3.1] - 2024-05-22

### Fixed:

- Fixed issue where `configSection` diagnostic check required `RateLimitingPlugin` to have a `configSection`

## [0.3.0] - 2024-04-25

### Added:

- Config diagnostic: Schema check support for beta installations
- Dev Proxy detection: Support for beta installations
- Setting: Version Preference setting determines which version toolkit should use when installed side-by-side
- Snippet: `devproxy-plugin-api-center-onboarding` - ApiCenterOnboardingPlugin instance
- Snippet: `devproxy-plugin-api-center-onboarding-config` - ApiCenterOnboardingPlugin config section
- Snippet: `devproxy-plugin-api-center-production-version` - ApiCenterProductionVersionPlugin instance
- Snippet: `devproxy-plugin-api-center-production-version-config` - ApiCenterProductionVersionPlugin config section
- Snippet: `devproxy-plugin-entra-mock-response` - EntraMockResponsePlugin instance
- Snippet: `devproxy-plugin-entra-mock-response-config` - EntraMockResponsePlugin config section
- Snippet: `devproxy-plugin-mock-request` - MockRequestPlugin instance
- Snippet: `devproxy-plugin-mock-request-config` - MockRequestPlugin config section
- Code Lens: `ApiCenterOnboardingPlugin`
- Code Lens: `ApiCenterProductionVersionPlugin`
- Code Lens: `EntraMockResponsePlugin`
- Code Lens: `MockRequestPlugin`

### Changed:

- Snippets: All snippets that reference schemas updated to use `v0.17.1` schema
- Snippets: Removed trailing comma from config section snippets
- Status bar: Replaced sync icon with loading icon
- Readme: Snippets table updated
- Dev Proxy detection: Improved latest version check logic, uses `devproxy outdated -s` command

### Fixed:

- Fixed broken link on `OpenApiSpecGeneratorPlugin` code lens

### Removed:

- Config diagnostic: Check for empty `urlsToWatch`

## [0.2.0] - 2024-02-15

### Added

- Dev Proxy detection: Check if installed
- Dev Proxy detection: Check if latest is installed
- Dev Proxy detection: Check if running
- Plugins: Documentation Code Lens
- Config diagnostic: Check that schema matches installed version of Dev Proxy
- Config diagnostic: Code action to update schema to correct version
- CI: Add publish workflow

### Changed

- Snippet: `devproxy-plugin-graph-select-guidance` corrected `name` property to `GraphSelectGuidancePlugin`
- Snippet: `devproxy-plugin-graph-minimal-permissions` corrected `name` property to `MinimalPermissionsPlugin`
- Snippet: `devproxy-plugin-odata-paging-guidance` corrected `name` property to `ODataPagingGuidancePlugin`
- Fixed indenting and removed extra whitespace on snippets
- Updated snippets to use opened arrays over multiple lines for easier update
from:
```json
"value": [ ]
```
to:
```json
"value": [

]
```

## [0.1.0] - 2024-01-18

### Added

- Snippet: `devproxy-config-file` - Dev Proxy config file
- Snippet: `devproxy-config-file-schema` - Dev Proxy config file schema
- Snippet: `devproxy-mocks-file` - Dev Proxy mocks file
- Snippet: `devproxy-mocks-file-schema` - Dev Proxy mocks file schema
- Snippet: `devproxy-mock` - Dev Proxy mock
- Snippet: `devproxy-request` - Dev Proxy request
- Snippet: `devproxy-response` - Dev Proxy response
- Snippet: `devproxy-response-header` - Dev Proxy response header
- Snippet: `devproxy-plugin-caching-guidance` - CachingGuidancePlugin instance
- Snippet: `devproxy-plugin-caching-guidance-config` - CachingGuidancePlugin config section
- Snippet: `devproxy-plugin-crud-api` - CrudApiPlugin instance
- Snippet: `devproxy-plugin-crud-api-config` - CrudApiPlugin config section
- Snippet: `devproxy-plugin-crud-api-file` - CrudApiPlugin API file
- Snippet: `devproxy-plugin-crud-api-file-schema` - CrudApiPlugin API file schema
- Snippet: `devproxy-plugin-crud-api-action` - CrudApiPlugin action
- Snippet: `devproxy-plugin-dev-tools` - DevToolsPlugin instance
- Snippet: `devproxy-plugin-dev-tools-config` - DevToolsPlugin config section
- Snippet: `devproxy-plugin-execution-summary` - ExecutionSummaryPlugin instance
- Snippet: `devproxy-plugin-execution-summary-config` - ExecutionSummaryPlugin config section
- Snippet: `devproxy-plugin-generic-random-error` - GenericRandomErrorPlugin instance
- Snippet: `devproxy-plugin-generic-random-error-config` - GenericRandomErrorPlugin config section
- Snippet: `devproxy-plugin-generic-random-error-file` - GenericRandomErrorPlugin errors file
- Snippet: `devproxy-plugin-generic-random-error-file-schema` - GenericRandomErrorPlugin errors file schema
- Snippet: `devproxy-plugin-graph-beta-support-guidance` - GraphBetaSupportGuidancePlugin instance
- Snippet: `devproxy-plugin-graph-client-request-id-guidance` - GraphClientRequestIdGuidancePlugin instance
- Snippet: `devproxy-plugin-graph-mock-response` - GraphMockResponsePlugin instance
- Snippet: `devproxy-plugin-graph-random-error` - GraphRandomErrorPlugin instance
- Snippet: `devproxy-plugin-graph-random-error-config` - GraphRandomErrorPlugin config section
- Snippet: `devproxy-plugin-graph-sdk-guidance` - GraphSdkGuidancePlugin instance
- Snippet: `devproxy-plugin-graph-select-guidance` - GraphSdkGuidancePlugin instance
- Snippet: `devproxy-plugin-latency` - LatencyPlugin instance
- Snippet: `devproxy-plugin-latency-config` - LatencyPlugin config section
- Snippet: `devproxy-plugin-graph-minimal-permissions-guidance` - MinimalPermissionsGuidancePlugin instance
- Snippet: `devproxy-plugin-graph-minimal-permissions-guidance-config` - MinimalPermissionsGuidancePlugin config section
- Snippet: `devproxy-plugin-graph-minimal-permissions` - MinimalPermissionsPlugin instance
- Snippet: `devproxy-plugin-graph-minimal-permissions-config` - MinimalPermissionsPlugin config section
- Snippet: `devproxy-plugin-mock-generator` - MockGeneratorPlugin instance
- Snippet: `devproxy-plugin-mock-response` - MockResponsePlugin instance
- Snippet: `devproxy-plugin-mock-response-config` - MockResponsePlugin config section
- Snippet: `devproxy-plugin-mock-response-schema` - MockResponsePlugin schema
- Snippet: `devproxy-plugin-odata-paging-guidance` - ODataPagingGuidancePlugin instance
- Snippet: `devproxy-plugin-graph-odsp-search-guidance` - ODSPSearchGuidancePlugin instance
- Snippet: `devproxy-plugin-open-api-spec-generator` - OpenApiSpecGeneratorPlugin instance
- Snippet: `devproxy-plugin-rate-limiting` - MockResponsePlugin instance
- Snippet: `devproxy-plugin-rate-limiting-config` - RateLimitingPlugin config section
- Snippet: `devproxy-plugin-rate-limiting-file` - Dev Proxy rate limiting file
- Snippet: `devproxy-plugin-rate-limiting-file-schema` - Dev Proxy rate limiting file schema
- Snippet: `devproxy-plugin-retry-after` - RetryAfterPlugin instance
- Config diagnostic: Check for empty `urlsToWatch`
- Config diagnostic: Check for missing `configSection` property in plugin instance for plugins that require configuration
- Config diagnostic: Check for missing `configSection` when defined in plugin instance
