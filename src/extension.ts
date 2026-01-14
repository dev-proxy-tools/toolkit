import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { handleStartNotification, processNotification } from './notifications';
import { registerDocumentListeners } from './documents';
import { registerCodeLens } from './code-lens';
import { createStatusBar, statusBarLoop, updateStatusBar } from './status-bar';
import { registerCodeActions } from './code-actions';
import { updateGlobalState } from './state';
import { VersionPreference } from './enums';
import { registerMcpServer } from './mcp';
import { registerTaskProvider } from './task-provider';

// Global variable to track the interval
let statusBarInterval: NodeJS.Timeout | undefined;

export const activate = async (context: vscode.ExtensionContext): Promise<vscode.ExtensionContext> => {

  const configuration = vscode.workspace.getConfiguration('dev-proxy-toolkit');
  const versionPreference = configuration.get('version') as VersionPreference;
  
  const statusBar = createStatusBar(context);
  await updateGlobalState(context, versionPreference);
  
  const collection = vscode.languages.createDiagnosticCollection('dev-proxy-toolkit');
  // Add collection to subscriptions for automatic disposal
  context.subscriptions.push(collection);
  
  registerDocumentListeners(context, collection);
  registerCodeActions(context);
  registerCodeLens(context);
  registerCommands(context, configuration);
  registerMcpServer(context);
  registerTaskProvider(context);

  const notification = handleStartNotification(context);
  processNotification(notification);

  updateStatusBar(context, statusBar);

  // Store the interval reference for proper cleanup
  statusBarInterval = setInterval(() => {
    // Add error handling to prevent uncaught exceptions
    try {
      statusBarLoop(context, statusBar, versionPreference);
    } catch (error) {
      console.error('Error in statusBarLoop:', error);
    }
  }, 5000);

  // Add the interval to subscriptions for automatic cleanup
  context.subscriptions.push({
    dispose: () => {
      if (statusBarInterval) {
        clearInterval(statusBarInterval);
        statusBarInterval = undefined;
      }
    }
  });

  return context;
};

export const deactivate = () => {
  // Clean up the interval if it's still running
  if (statusBarInterval) {
    clearInterval(statusBarInterval);
    statusBarInterval = undefined;
  }
};
