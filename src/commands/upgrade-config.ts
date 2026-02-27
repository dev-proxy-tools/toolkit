import * as vscode from 'vscode';
import { Commands } from '../constants';
import { DevProxyInstall } from '../types';
import { getNormalizedVersion } from '../utils';

/**
 * Config upgrade commands.
 */

export function registerUpgradeConfigCommands(
  context: vscode.ExtensionContext,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.upgradeConfigs, (fileUris?: vscode.Uri[]) =>
      upgradeConfigsWithCopilot(context, fileUris)
    )
  );
}

async function upgradeConfigsWithCopilot(
  context: vscode.ExtensionContext,
  fileUris?: vscode.Uri[],
): Promise<void> {
  const devProxyInstall = context.globalState.get<DevProxyInstall>('devProxyInstall');
  if (!devProxyInstall?.isInstalled) {
    return;
  }

  const devProxyVersion = getNormalizedVersion(devProxyInstall);

  const fileList = fileUris?.length
    ? fileUris.map(uri => `- ${vscode.workspace.asRelativePath(uri)}`).join('\n')
    : 'all Dev Proxy config files in the workspace';

  const prompt = [
    `Upgrade the following Dev Proxy configuration files to version v${devProxyVersion}:`,
    '',
    fileList,
    '',
    `Use the Dev Proxy MCP tools to get the latest schema information for v${devProxyVersion} and update each config file.`,
    'Update the $schema URLs and make any necessary configuration changes for the new version.',
  ].join('\n');

  try {
    // workbench.action.chat.open requires GitHub Copilot Chat extension
    const allCommands = await vscode.commands.getCommands();
    if (!allCommands.includes('workbench.action.chat.open')) {
      vscode.window.showWarningMessage(
        'GitHub Copilot Chat is not available. Please install the GitHub Copilot extension to use this feature.'
      );
      return;
    }

    await vscode.commands.executeCommand('workbench.action.chat.open', {
      query: prompt,
      isPartialQuery: false,
    });
  } catch {
    vscode.window.showWarningMessage(
      'Could not open Copilot Chat. Please make sure GitHub Copilot is installed and enabled.'
    );
  }
}
