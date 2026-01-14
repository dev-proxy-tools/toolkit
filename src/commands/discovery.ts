import * as vscode from 'vscode';
import { Commands } from '../constants/commands';
import { TerminalService } from '../services/terminal';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';

/**
 * URL discovery command.
 */

export function registerDiscoveryCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  const versionPreference = configuration.get('version') as VersionPreference;
  const devProxyExe = getDevProxyExe(versionPreference);

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.discoverUrls, () =>
      discoverUrlsToWatch(devProxyExe, configuration)
    )
  );
}

async function discoverUrlsToWatch(
  devProxyExe: string,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  const terminalService = TerminalService.fromConfiguration();
  const terminal = terminalService.getOrCreateTerminal();

  const processNames = await vscode.window.showInputBox({
    prompt:
      'Enter the process names (space separated). Leave empty to intercept requests from all processes.',
    placeHolder: 'msedge pwsh',
    value: '',
    title: 'Intercept requests from specific processes',
    validateInput: validateProcessNames,
  });

  // User cancelled
  if (processNames === undefined) {
    return;
  }

  const command = buildDiscoverCommand(devProxyExe, processNames);
  terminalService.sendCommand(terminal, command);
}

function validateProcessNames(value: string): string | undefined {
  // Empty is valid (means all processes)
  if (!value) {
    return undefined;
  }

  // Must contain only alphanumeric characters and spaces
  if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
    return 'Process names can only contain alphanumeric characters and spaces';
  }

  return undefined;
}

function buildDiscoverCommand(devProxyExe: string, processNames: string): string {
  if (processNames.trim()) {
    return `${devProxyExe} --discover --watch-process-names ${processNames.trim()}`;
  }
  return `${devProxyExe} --discover`;
}
