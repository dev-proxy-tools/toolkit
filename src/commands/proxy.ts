import * as vscode from 'vscode';
import { Commands, ContextKeys } from '../constants';
import { DevProxyApiClient } from '../services/api-client';
import { TerminalService } from '../services/terminal';
import { isConfigFile } from '../utils';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';
import * as logger from '../logger';

/**
 * Proxy lifecycle commands: start, start with options, stop, restart.
 *
 * These commands control the Dev Proxy process.
 */

export function registerProxyCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  const versionPreference = configuration.get('version') as VersionPreference;
  const devProxyExe = getDevProxyExe(versionPreference);
  const apiClient = DevProxyApiClient.fromConfiguration();

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.start, () => startDevProxy(configuration, devProxyExe))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.startWithOptions, () =>
      startDevProxyWithOptions(devProxyExe)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.stop, () =>
      stopDevProxy(apiClient, devProxyExe, configuration)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.restart, () =>
      restartDevProxy(apiClient, configuration, devProxyExe)
    )
  );
}

async function startDevProxy(
  configuration: vscode.WorkspaceConfiguration,
  devProxyExe: string
): Promise<void> {
  const terminalService = TerminalService.fromConfiguration();
  const terminal = terminalService.getOrCreateTerminal();

  const configFilePath = getActiveConfigFilePath();
  const command = configFilePath ? `${devProxyExe} --config-file "${configFilePath}"` : devProxyExe;

  logger.debug('Starting Dev Proxy', { configFile: configFilePath ?? 'default' });
  terminalService.sendCommand(terminal, command);
}

async function startDevProxyWithOptions(devProxyExe: string): Promise<void> {
  const args: string[] = [];

  // Config file
  const configFiles = await vscode.workspace.findFiles(
    '**/devproxyrc.{json,jsonc}',
    '**/node_modules/**'
  );
  const configItems: vscode.QuickPickItem[] = [
    { label: '$(remove) None', description: 'Use default configuration' },
    ...configFiles.map(f => ({
      label: vscode.workspace.asRelativePath(f),
      description: f.fsPath,
    })),
  ];

  const selectedConfig = await vscode.window.showQuickPick(configItems, {
    title: 'Start with Options (1/13): Config file',
    placeHolder: 'Select a config file',
  });
  if (selectedConfig === undefined) {
    return;
  }
  if (selectedConfig.description && selectedConfig.description !== 'Use default configuration') {
    args.push('--config-file', `"${selectedConfig.description}"`);
  }

  // Port
  const port = await vscode.window.showInputBox({
    title: 'Start with Options (2/13): Port',
    prompt: 'Enter the proxy port number',
    value: '8000',
    validateInput: validatePortNumber,
  });
  if (port === undefined) {
    return;
  }
  if (port && port !== '8000') {
    args.push('--port', port);
  }

  // API port
  const apiPort = await vscode.window.showInputBox({
    title: 'Start with Options (3/13): API port',
    prompt: 'Enter the API port number',
    value: '8897',
    validateInput: validatePortNumber,
  });
  if (apiPort === undefined) {
    return;
  }
  if (apiPort && apiPort !== '8897') {
    args.push('--api-port', apiPort);
  }

  // IP address
  const ipAddress = await vscode.window.showInputBox({
    title: 'Start with Options (4/13): IP address',
    prompt: 'Enter the IP address to listen on',
    value: '127.0.0.1',
    validateInput: validateIpAddress,
  });
  if (ipAddress === undefined) {
    return;
  }
  if (ipAddress && ipAddress !== '127.0.0.1') {
    args.push('--ip-address', ipAddress);
  }

  // As system proxy
  const asSystemProxy = await vscode.window.showQuickPick(
    [
      { label: 'Yes', description: 'Register as system proxy (default)' },
      { label: 'No', description: 'Do not register as system proxy' },
    ],
    {
      title: 'Start with Options (5/13): As system proxy',
      placeHolder: 'Register Dev Proxy as a system proxy?',
    }
  );
  if (asSystemProxy === undefined) {
    return;
  }
  if (asSystemProxy.label === 'No') {
    args.push('--as-system-proxy', 'false');
  }

  // Install cert
  const installCert = await vscode.window.showQuickPick(
    [
      { label: 'Yes', description: 'Install certificate (default)' },
      { label: 'No', description: 'Do not install certificate' },
    ],
    {
      title: 'Start with Options (6/13): Install certificate',
      placeHolder: 'Install the root certificate?',
    }
  );
  if (installCert === undefined) {
    return;
  }
  if (installCert.label === 'No') {
    args.push('--install-cert', 'false');
  }

  // Log level
  const logLevel = await vscode.window.showQuickPick(
    ['trace', 'debug', 'information', 'warning', 'error'],
    {
      title: 'Start with Options (7/13): Log level',
      placeHolder: 'Select a log level',
    }
  );
  if (logLevel === undefined) {
    return;
  }
  if (logLevel !== 'information') {
    args.push('--log-level', logLevel);
  }

  // Failure rate
  const failureRate = await vscode.window.showInputBox({
    title: 'Start with Options (8/13): Failure rate',
    prompt: 'Enter the failure rate (0-100)',
    value: '50',
    validateInput: validateFailureRate,
  });
  if (failureRate === undefined) {
    return;
  }
  if (failureRate && failureRate !== '50') {
    args.push('--failure-rate', failureRate);
  }

  // URLs to watch
  const urlsToWatch = await vscode.window.showInputBox({
    title: 'Start with Options (9/13): URLs to watch',
    prompt: 'Enter URLs to watch (space separated). Leave empty to use config file values.',
    placeHolder: 'https://api.example.com/* https://graph.microsoft.com/v1.0/*',
    value: '',
  });
  if (urlsToWatch === undefined) {
    return;
  }
  if (urlsToWatch.trim()) {
    args.push('--urls-to-watch', urlsToWatch.trim());
  }

  // Record
  const record = await vscode.window.showQuickPick(
    [
      { label: 'No', description: 'Do not record (default)' },
      { label: 'Yes', description: 'Start recording immediately' },
    ],
    {
      title: 'Start with Options (10/13): Record',
      placeHolder: 'Start recording on launch?',
    }
  );
  if (record === undefined) {
    return;
  }
  if (record.label === 'Yes') {
    args.push('--record');
  }

  // No first run
  const noFirstRun = await vscode.window.showQuickPick(
    [
      { label: 'No', description: 'Show first run experience (default)' },
      { label: 'Yes', description: 'Skip first run experience' },
    ],
    {
      title: 'Start with Options (11/13): No first run',
      placeHolder: 'Skip the first run experience?',
    }
  );
  if (noFirstRun === undefined) {
    return;
  }
  if (noFirstRun.label === 'Yes') {
    args.push('--no-first-run');
  }

  // Timeout
  const timeout = await vscode.window.showInputBox({
    title: 'Start with Options (12/13): Timeout',
    prompt: 'Enter timeout in seconds. Leave empty for no timeout.',
    value: '',
    validateInput: validateTimeout,
  });
  if (timeout === undefined) {
    return;
  }
  if (timeout.trim()) {
    args.push('--timeout', timeout.trim());
  }

  // Watch PIDs
  const watchPids = await vscode.window.showInputBox({
    title: 'Start with Options (13/13): Watch PIDs',
    prompt: 'Enter process IDs to watch (space separated). Leave empty to skip.',
    placeHolder: '1234 5678',
    value: '',
    validateInput: validateWatchPids,
  });
  if (watchPids === undefined) {
    return;
  }
  if (watchPids.trim()) {
    args.push('--watch-pids', watchPids.trim());
  }

  // Watch process names
  const watchProcessNames = await vscode.window.showInputBox({
    prompt: 'Enter process names to watch (space separated). Leave empty to skip.',
    placeHolder: 'msedge chrome',
    value: '',
    validateInput: validateProcessNames,
  });
  if (watchProcessNames === undefined) {
    return;
  }
  if (watchProcessNames.trim()) {
    args.push('--watch-process-names', watchProcessNames.trim());
  }

  const command = [devProxyExe, ...args].join(' ');
  const terminalService = TerminalService.fromConfiguration();
  const terminal = terminalService.getOrCreateTerminal();
  terminalService.sendCommand(terminal, command);
}

function validatePortNumber(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 65535) {
    return 'Port must be an integer between 1 and 65535';
  }
  return undefined;
}

function validateIpAddress(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const parts = value.split('.');
  if (parts.length !== 4) {
    return 'Enter a valid IPv4 address (e.g. 127.0.0.1)';
  }
  for (const part of parts) {
    const num = Number(part);
    if (!/^\d{1,3}$/.test(part) || num < 0 || num > 255) {
      return 'Enter a valid IPv4 address (e.g. 127.0.0.1)';
    }
  }
  return undefined;
}

function validateFailureRate(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0 || num > 100) {
    return 'Failure rate must be an integer between 0 and 100';
  }
  return undefined;
}

function validateTimeout(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    return 'Timeout must be a positive integer';
  }
  return undefined;
}

function validateWatchPids(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const parts = value.trim().split(/\s+/);
  for (const part of parts) {
    const num = Number(part);
    if (!Number.isInteger(num) || num < 1) {
      return 'PIDs must be positive integers separated by spaces';
    }
  }
  return undefined;
}

function validateProcessNames(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
    return 'Process names can only contain alphanumeric characters and spaces';
  }
  return undefined;
}

async function stopDevProxy(
  apiClient: DevProxyApiClient,
  devProxyExe: string,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  logger.debug('Stopping Dev Proxy');
  await apiClient.stop();

  const closeTerminal = configuration.get<boolean>('closeTerminal', true);
  if (closeTerminal) {
    logger.debug('Waiting for Dev Proxy to stop before closing terminal');
    await waitForProxyToStop(apiClient);

    const terminalService = TerminalService.fromConfiguration();
    terminalService.disposeDevProxyTerminals();
    logger.debug('Dev Proxy terminals disposed');
  }
}

async function restartDevProxy(
  apiClient: DevProxyApiClient,
  configuration: vscode.WorkspaceConfiguration,
  devProxyExe: string
): Promise<void> {
  logger.debug('Restarting Dev Proxy');
  try {
    await apiClient.stop();
    await waitForProxyToStop(apiClient);

    const terminalService = TerminalService.fromConfiguration();
    const terminal = terminalService.getOrCreateTerminal();

    const configFilePath = getActiveConfigFilePath();
    const command = configFilePath
      ? `${devProxyExe} --config-file "${configFilePath}"`
      : devProxyExe;

    terminalService.sendCommand(terminal, command);
    logger.debug('Dev Proxy restart command sent');
  } catch (error) {
    logger.error('Failed to restart Dev Proxy', error);
    vscode.window.showErrorMessage('Failed to restart Dev Proxy');
  }
}

/**
 * Wait for Dev Proxy to stop running.
 */
async function waitForProxyToStop(apiClient: DevProxyApiClient): Promise<void> {
  while (await apiClient.isRunning()) {
    await sleep(1000);
  }
}

/**
 * Get the config file path from the active editor, if it's a config file.
 */
function getActiveConfigFilePath(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor && isConfigFile(editor.document)) {
    return editor.document.uri.fsPath;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
