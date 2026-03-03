import * as vscode from 'vscode';

/**
 * Centralized logger for the Dev Proxy Toolkit extension.
 *
 * Uses a VS Code LogOutputChannel to provide leveled logging that
 * appears in the Output panel and respects the user's log level settings.
 */

let logger: vscode.LogOutputChannel | undefined;

/**
 * Initialize the logger. Must be called once during extension activation.
 */
export function initializeLogger(): vscode.LogOutputChannel {
  logger = vscode.window.createOutputChannel('Dev Proxy Toolkit', { log: true });
  return logger;
}

/**
 * Get the logger instance. Falls back to a no-op if not initialized.
 */
function getLogger(): vscode.LogOutputChannel | undefined {
  return logger;
}

/**
 * Log a trace-level message.
 */
export function trace(message: string, ...args: unknown[]): void {
  try {
    getLogger()?.trace(message, ...args);
  } catch { /* channel may be closed */ }
}

/**
 * Log a debug-level message.
 */
export function debug(message: string, ...args: unknown[]): void {
  try {
    getLogger()?.debug(message, ...args);
  } catch { /* channel may be closed */ }
}

/**
 * Log an info-level message.
 */
export function info(message: string, ...args: unknown[]): void {
  try {
    getLogger()?.info(message, ...args);
  } catch { /* channel may be closed */ }
}

/**
 * Log a warning-level message.
 */
export function warn(message: string, ...args: unknown[]): void {
  try {
    getLogger()?.warn(message, ...args);
  } catch { /* channel may be closed */ }
}

/**
 * Log an error-level message.
 */
export function error(message: string, ...args: unknown[]): void {
  try {
    getLogger()?.error(message, ...args);
  } catch { /* channel may be closed */ }
}
