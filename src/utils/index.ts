/**
 * Utility module barrel exports.
 *
 * This provides a clean import path for utility functions:
 *
 *   import { isConfigFile, getASTNode, executeCommand } from './utils';
 */

// AST utilities
export {
  getASTNode,
  getRangeFromASTNode,
  getStartPositionFromASTNode,
  getDiagnosticCode,
  getSchemaUrl,
} from './ast';

// Config file detection
export { isConfigFile, isProxyFile, extractVersionFromSchemaUrl, findOutdatedConfigFiles } from './config-detection';

// Shell execution utilities
export {
  executeCommand,
  sleep,
  getPackageIdentifier,
  getInstallScriptUrl,
  upgradeDevProxyWithPackageManager,
  openUpgradeDocumentation,
  resolveDevProxyExecutable,
} from './shell';

// Re-export from detect for convenience
export { getDevProxyExe, getNormalizedVersion } from '../detect';

// Workspace recommendations utilities
export {
  hasDevProxyConfig,
  isExtensionRecommended,
  addExtensionToRecommendations,
  promptForWorkspaceRecommendation,
} from './workspace-recommendations';
