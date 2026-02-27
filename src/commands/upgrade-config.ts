import * as vscode from 'vscode';
import { Commands } from '../constants';
import { DevProxyInstall } from '../types';

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

  const devProxyVersion = devProxyInstall.isBeta
    ? devProxyInstall.version.split('-')[0]
    : devProxyInstall.version;

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
