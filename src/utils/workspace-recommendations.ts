import * as vscode from 'vscode';
import * as path from 'path';
import { Extension } from '../constants';

/**
 * Utilities for managing workspace extension recommendations.
 */

/**
 * Check if workspace contains Dev Proxy config files.
 */
export async function hasDevProxyConfig(): Promise<boolean> {
  const files = await vscode.workspace.findFiles(
    '{devproxyrc.json,devproxyrc.jsonc}',
    '**/node_modules/**'
  );
  return files.length > 0;
}

/**
 * Check if the Dev Proxy Toolkit extension is already in workspace recommendations.
 */
export async function isExtensionRecommended(): Promise<boolean> {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    return false;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const extensionsJsonPath = path.join(workspaceFolder.uri.fsPath, Extension.extensionsJsonPath);

  try {
    const uri = vscode.Uri.file(extensionsJsonPath);
    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();
    const json = JSON.parse(content);

    if (json.recommendations && Array.isArray(json.recommendations)) {
      return json.recommendations.includes(Extension.id);
    }
  } catch (error) {
    // File doesn't exist or can't be parsed
    return false;
  }

  return false;
}

/**
 * Add the Dev Proxy Toolkit extension to workspace recommendations.
 */
export async function addExtensionToRecommendations(): Promise<boolean> {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    return false;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const vscodeFolderPath = path.join(workspaceFolder.uri.fsPath, '.vscode');
  const extensionsJsonPath = path.join(workspaceFolder.uri.fsPath, Extension.extensionsJsonPath);

  try {
    let json: { recommendations?: string[] } = {};

    // Try to read existing file
    try {
      const uri = vscode.Uri.file(extensionsJsonPath);
      const document = await vscode.workspace.openTextDocument(uri);
      json = JSON.parse(document.getText());
    } catch {
      // File doesn't exist or can't be parsed, create new structure
      json = { recommendations: [] };
    }

    // Ensure recommendations array exists
    if (!json.recommendations) {
      json.recommendations = [];
    }

    // Add extension if not already present
    if (!json.recommendations.includes(Extension.id)) {
      json.recommendations.push(Extension.id);
    }

    // Create .vscode directory if it doesn't exist
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(vscodeFolderPath));
    } catch {
      // Directory might already exist
    }

    // Write the updated file
    const uri = vscode.Uri.file(extensionsJsonPath);
    const content = JSON.stringify(json, null, 2);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));

    return true;
  } catch (error) {
    console.error('Error adding extension to recommendations:', error);
    return false;
  }
}

/**
 * Prompt user to add the extension to workspace recommendations.
 */
export async function promptForWorkspaceRecommendation(context: vscode.ExtensionContext): Promise<void> {
  // Check if we've already prompted for this workspace
  const workspaceKey = vscode.workspace.workspaceFolders?.[0]?.uri.toString() ?? '';
  const storageKey = `recommendation-prompted-${workspaceKey}`;
  
  if (context.globalState.get(storageKey)) {
    // Already prompted for this workspace
    return;
  }

  // Check if workspace has Dev Proxy config
  const hasConfig = await hasDevProxyConfig();
  if (!hasConfig) {
    return;
  }

  // Check if extension is already recommended
  const isRecommended = await isExtensionRecommended();
  if (isRecommended) {
    return;
  }

  // Mark as prompted to avoid showing again
  await context.globalState.update(storageKey, true);

  // Show prompt
  const message = 'This workspace contains Dev Proxy configuration files. Would you like to add the Dev Proxy Toolkit extension to workspace recommendations?';
  const result = await vscode.window.showInformationMessage(message, 'Yes', 'No');

  if (result === 'Yes') {
    const success = await addExtensionToRecommendations();
    if (success) {
      vscode.window.showInformationMessage('Dev Proxy Toolkit added to workspace recommendations.');
    } else {
      vscode.window.showErrorMessage('Failed to add extension to workspace recommendations.');
    }
  }
}
