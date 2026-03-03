import * as vscode from 'vscode';
import { Commands, ContextKeys } from '../constants';
import { DevProxyApiClient } from '../services/api-client';
import { TerminalService } from '../services/terminal';
import { isConfigFile } from '../utils';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';
import * as logger from '../logger';

/**
 * Proxy lifecycle commands: start, stop, restart.
 *
 * These commands control the Dev Proxy process.
 */

export function registerProxyCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  const versionPreference = configuration.get('version') as VersionPreference;
  const devProxyExe = getDevProxyExe(versionPreference);
  const apiClient = DevProxyApiClient.fromConfiguration();

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.start, () => startDevProxy(configuration, devProxyExe))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.stop, () =>
      stopDevProxy(apiClient, devProxyExe, configuration)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.restart, () =>
      restartDevProxy(apiClient, configuration, devProxyExe)
    )
  );
}

async function startDevProxy(
  configuration: vscode.WorkspaceConfiguration,
  devProxyExe: string
): Promise<void> {
  const terminalService = TerminalService.fromConfiguration();
  const terminal = terminalService.getOrCreateTerminal();

  const configFilePath = getActiveConfigFilePath();
  const command = configFilePath ? `${devProxyExe} --config-file "${configFilePath}"` : devProxyExe;

  logger.debug('Starting Dev Proxy', { configFile: configFilePath ?? 'default' });
  terminalService.sendCommand(terminal, command);
}

async function stopDevProxy(
  apiClient: DevProxyApiClient,
  devProxyExe: string,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  logger.debug('Stopping Dev Proxy');
  await apiClient.stop();

  const closeTerminal = configuration.get<boolean>('closeTerminal', true);
  if (closeTerminal) {
    logger.debug('Waiting for Dev Proxy to stop before closing terminal');
    await waitForProxyToStop(apiClient);

    const terminalService = TerminalService.fromConfiguration();
    terminalService.disposeDevProxyTerminals();
    logger.debug('Dev Proxy terminals disposed');
  }
}

async function restartDevProxy(
  apiClient: DevProxyApiClient,
  configuration: vscode.WorkspaceConfiguration,
  devProxyExe: string
): Promise<void> {
  logger.debug('Restarting Dev Proxy');
  try {
    await apiClient.stop();
    await waitForProxyToStop(apiClient);

    const terminalService = TerminalService.fromConfiguration();
    const terminal = terminalService.getOrCreateTerminal();

    const configFilePath = getActiveConfigFilePath();
    const command = configFilePath
      ? `${devProxyExe} --config-file "${configFilePath}"`
      : devProxyExe;

    terminalService.sendCommand(terminal, command);
    logger.debug('Dev Proxy restart command sent');
  } catch (error) {
    logger.error('Failed to restart Dev Proxy', error);
    vscode.window.showErrorMessage('Failed to restart Dev Proxy');
  }
}

/**
 * Wait for Dev Proxy to stop running.
 */
async function waitForProxyToStop(apiClient: DevProxyApiClient): Promise<void> {
  while (await apiClient.isRunning()) {
    await sleep(1000);
  }
}

/**
 * Get the config file path from the active editor, if it's a config file.
 */
function getActiveConfigFilePath(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor && isConfigFile(editor.document)) {
    return editor.document.uri.fsPath;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
