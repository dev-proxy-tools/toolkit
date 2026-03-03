import * as vscode from 'vscode';
import { Commands, ContextKeys } from '../constants';
import { DevProxyApiClient } from '../services/api-client';
import * as logger from '../logger';

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
    logger.info('Recording started');
    vscode.commands.executeCommand('setContext', ContextKeys.isRecording, true);
  } catch (error) {
    logger.error('Failed to start recording', error);
    vscode.window.showErrorMessage('Failed to start recording');
  }
}

async function stopRecording(apiClient: DevProxyApiClient): Promise<void> {
  try {
    await apiClient.stopRecording();
    logger.info('Recording stopped');
    vscode.commands.executeCommand('setContext', ContextKeys.isRecording, false);
  } catch (error) {
    logger.error('Failed to stop recording', error);
    vscode.window.showErrorMessage('Failed to stop recording');
  }
}

async function raiseMockRequest(apiClient: DevProxyApiClient): Promise<void> {
  try {
    await apiClient.raiseMockRequest();
    logger.info('Mock request raised');
    vscode.window.showInformationMessage('Mock request raised');
  } catch (error) {
    logger.error('Failed to raise mock request', error);
    vscode.window.showErrorMessage('Failed to raise mock request');
  }
}
