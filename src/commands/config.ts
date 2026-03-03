import * as vscode from 'vscode';
import { Commands } from '../constants';
import { executeCommand } from '../utils/shell';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';
import * as logger from '../logger';

/**
 * Configuration file commands: open, create new.
 */

export function registerConfigCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  const versionPreference = configuration.get('version') as VersionPreference;
  const devProxyExe = getDevProxyExe(versionPreference);

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.configOpen, () => openConfig(devProxyExe))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.configNew, () => createNewConfig(devProxyExe))
  );
}

async function openConfig(devProxyExe: string): Promise<void> {
  logger.debug('Opening Dev Proxy config', { devProxyExe });
  await executeCommand(`${devProxyExe} config open`);
}

async function createNewConfig(devProxyExe: string): Promise<void> {
  const fileName = await promptForFileName();
  if (!fileName) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    logger.warn('Cannot create config: no workspace folder open');
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }
  logger.info('Creating new config file', { fileName, workspaceFolder });

  const devProxyFolder = vscode.Uri.file(`${workspaceFolder}/.devproxy`);
  const configUri = vscode.Uri.file(`${workspaceFolder}/.devproxy/${fileName}`);

  // Check if file already exists
  if (await fileExists(configUri)) {
    logger.warn('Config file already exists', { path: configUri.fsPath });
    vscode.window.showErrorMessage('A file with that name already exists');
    return;
  }

  try {
    // Ensure .devproxy folder exists
    await ensureDirectoryExists(devProxyFolder);

    // Create the config file
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Creating new config file...',
      },
      async () => {
        await executeCommand(`${devProxyExe} config new ${fileName}`, {
          cwd: `${workspaceFolder}/.devproxy`,
        });
      }
    );

    // Open the newly created file
    logger.info('Config file created', { path: configUri.fsPath });
    const document = await vscode.workspace.openTextDocument(configUri);
    await vscode.window.showTextDocument(document);
  } catch (error) {
    logger.error('Failed to create new config file', error);
    vscode.window.showErrorMessage('Failed to create new config file');
  }
}

async function promptForFileName(): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt: 'Enter the name of the new config file',
    placeHolder: 'devproxyrc.json',
    value: 'devproxyrc.json',
    validateInput: validateFileName,
  });
}

function validateFileName(value: string): string | undefined {
  const errors: string[] = [];

  if (!value) {
    errors.push('The file name cannot be empty');
  }

  const invalidChars = /[/\\:*?"<>|\s]/;
  if (invalidChars.test(value)) {
    errors.push('The file name cannot contain special characters');
  }

  if (!value.endsWith('.json') && !value.endsWith('.jsonc')) {
    errors.push('The file name must use .json or .jsonc extension');
  }

  return errors.length > 0 ? errors[0] : undefined;
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type === vscode.FileType.File;
  } catch {
    return false;
  }
}

async function ensureDirectoryExists(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.stat(uri);
  } catch {
    await vscode.workspace.fs.createDirectory(uri);
  }
}
