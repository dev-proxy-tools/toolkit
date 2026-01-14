/**
 * Central registry of all command IDs used in the extension.
 *
 * Using this object instead of string literals throughout the codebase:
 * - Enables IDE autocomplete
 * - Makes refactoring safer
 * - Makes it easy to find all command usages
 * - Prevents typos
 */
export const Commands = {
  // Proxy lifecycle commands
  start: 'dev-proxy-toolkit.start',
  stop: 'dev-proxy-toolkit.stop',
  restart: 'dev-proxy-toolkit.restart',

  // Recording commands
  recordStart: 'dev-proxy-toolkit.record-start',
  recordStop: 'dev-proxy-toolkit.record-stop',

  // Mock commands
  raiseMock: 'dev-proxy-toolkit.raise-mock',

  // Configuration commands
  configOpen: 'dev-proxy-toolkit.config-open',
  configNew: 'dev-proxy-toolkit.config-new',

  // Discovery commands
  discoverUrls: 'dev-proxy-toolkit.discover-urls-to-watch',

  // Installation commands
  install: 'dev-proxy-toolkit.install',
  upgrade: 'dev-proxy-toolkit.upgrade',

  // JWT commands
  jwtCreate: 'dev-proxy-toolkit.jwt-create',

  // Documentation commands
  openPluginDoc: 'dev-proxy-toolkit.openPluginDoc',

  // Language model commands
  addLanguageModelConfig: 'dev-proxy-toolkit.addLanguageModelConfig',
} as const;

/**
 * Type for command ID values.
 */
export type CommandId = (typeof Commands)[keyof typeof Commands];

/**
 * VS Code context keys set by this extension.
 *
 * These are used in when clauses for command enablement and menu visibility.
 */
export const ContextKeys = {
  isInstalled: 'isDevProxyInstalled',
  isRunning: 'isDevProxyRunning',
  isRecording: 'isDevProxyRecording',
  isConfigFile: 'isDevProxyConfigFile',
} as const;

/**
 * Diagnostic codes used for identifying specific issues.
 *
 * These codes are used in diagnostics and code actions to match
 * specific problems with their fixes.
 */
export const DiagnosticCodes = {
  invalidSchema: 'invalidSchema',
  invalidConfigSection: 'invalidConfigSection',
  deprecatedPluginPath: 'deprecatedPluginPath',
  missingLanguageModel: 'missingLanguageModel',
} as const;

/**
 * External URLs used by the extension.
 */
export const Urls = {
  upgradeDoc: 'https://aka.ms/devproxy/upgrade',
  linuxInstall: 'https://aka.ms/devproxy/start/linux',
  schemaBase: 'https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas',
} as const;

/**
 * Build a schema URL for a specific version.
 */
export function getSchemaUrl(version: string): string {
  return `${Urls.schemaBase}/v${version}/rc.schema.json`;
}
