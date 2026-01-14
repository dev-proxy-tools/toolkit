import * as vscode from 'vscode';
import { registerProxyCommands } from './proxy';
import { registerRecordingCommands } from './recording';
import { registerConfigCommands } from './config';
import { registerInstallCommands } from './install';
import { registerJwtCommands } from './jwt';
import { registerDiscoveryCommands } from './discovery';
import { registerDocCommands } from './docs';

/**
 * Register all commands for the extension.
 *
 * Commands are organized into logical groups:
 * - proxy: start, stop, restart
 * - recording: start/stop recording, raise mock
 * - config: open, create new
 * - install: install, upgrade
 * - jwt: create JWT tokens
 * - discovery: discover URLs to watch
 * - docs: open plugin documentation, add language model config
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  registerProxyCommands(context, configuration);
  registerRecordingCommands(context);
  registerConfigCommands(context, configuration);
  registerInstallCommands(context, configuration);
  registerJwtCommands(context, configuration);
  registerDiscoveryCommands(context, configuration);
  registerDocCommands(context);
}

// Re-export individual modules for testing and direct access
export { registerProxyCommands } from './proxy';
export { registerRecordingCommands } from './recording';
export { registerConfigCommands } from './config';
export { registerInstallCommands } from './install';
export { registerJwtCommands } from './jwt';
export { registerDiscoveryCommands } from './discovery';
export { registerDocCommands } from './docs';
