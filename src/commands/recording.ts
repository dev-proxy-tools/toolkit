import * as vscode from 'vscode';
import { Commands, ContextKeys } from '../constants/commands';
import { DevProxyApiClient } from '../services/api-client';

/**
 * Recording commands: start/stop recording API requests.
 */

export function registerRecordingCommands(context: vscode.ExtensionContext): void {
  const apiClient = DevProxyApiClient.fromConfiguration();

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.recordStart, () => startRecording(apiClient))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.recordStop, () => stopRecording(apiClient))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.raiseMock, () => raiseMockRequest(apiClient))
  );
}

async function startRecording(apiClient: DevProxyApiClient): Promise<void> {
  try {
    await apiClient.startRecording();
    vscode.commands.executeCommand('setContext', ContextKeys.isRecording, true);
  } catch {
    vscode.window.showErrorMessage('Failed to start recording');
  }
}

async function stopRecording(apiClient: DevProxyApiClient): Promise<void> {
  try {
    await apiClient.stopRecording();
    vscode.commands.executeCommand('setContext', ContextKeys.isRecording, false);
  } catch {
    vscode.window.showErrorMessage('Failed to stop recording');
  }
}

async function raiseMockRequest(apiClient: DevProxyApiClient): Promise<void> {
  await apiClient.raiseMockRequest();
  vscode.window.showInformationMessage('Mock request raised');
}
