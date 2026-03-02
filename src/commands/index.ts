import * as vscode from 'vscode';
import { registerProxyCommands } from './proxy';
import { registerRecordingCommands } from './recording';
import { registerConfigCommands } from './config';
import { registerInstallCommands } from './install';
import { registerJwtCommands } from './jwt';
import { registerDiscoveryCommands } from './discovery';
import { registerDocCommands } from './docs';
import { Commands } from '../constants';
import { addExtensionToRecommendations } from '../utils';

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
 * - workspace: add to recommendations
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

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.addToRecommendations, async () => {
      const success = await addExtensionToRecommendations();
      if (success) {
        vscode.window.showInformationMessage('Dev Proxy Toolkit added to workspace recommendations.');
      } else {
        vscode.window.showErrorMessage('Failed to add extension to workspace recommendations. Ensure a workspace folder is open.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.resetState, async () => {
      const keys = context.globalState.keys();
      for (const key of keys) {
        await context.globalState.update(key, undefined);
      }
      vscode.window.showInformationMessage('Dev Proxy Toolkit state has been reset. Reload the window to apply changes.', 'Reload').then(action => {
        if (action === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
    })
  );
}

// Re-export individual modules for testing and direct access
export { registerProxyCommands } from './proxy';
export { registerRecordingCommands } from './recording';
export { registerConfigCommands } from './config';
export { registerInstallCommands } from './install';
export { registerJwtCommands } from './jwt';
export { registerDiscoveryCommands } from './discovery';
export { registerDocCommands } from './docs';
