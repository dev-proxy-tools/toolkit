import * as vscode from 'vscode';
import { Commands } from '../constants';
import { executeCommand } from '../utils/shell';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';

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
  await executeCommand(`${devProxyExe} config open`);
}

async function createNewConfig(devProxyExe: string): Promise<void> {
  const fileName = await promptForFileName();
  if (!fileName) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const devProxyFolder = vscode.Uri.file(`${workspaceFolder}/.devproxy`);
  const configUri = vscode.Uri.file(`${workspaceFolder}/.devproxy/${fileName}`);

  // Check if file already exists
  if (await fileExists(configUri)) {
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
    const document = await vscode.workspace.openTextDocument(configUri);
    await vscode.window.showTextDocument(document);
  } catch (error) {
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
