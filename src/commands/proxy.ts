import * as vscode from 'vscode';
import * as path from 'path';
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

interface StartOption {
  key: string;
  label: string;
  value: string;
  defaultValue: string;
  flag: string;
  editor: 'input' | 'pick' | 'config';
  prompt?: string;
  placeholder?: string;
  validate?: (value: string) => string | undefined;
  choices?: string[];
}

const startOptionDefaults: Omit<StartOption, 'value'>[] = [
  {
    key: 'configFile',
    label: 'Config file',
    defaultValue: '',
    flag: '--config-file',
    editor: 'config',
  },
  {
    key: 'port',
    label: 'Port',
    defaultValue: '8000',
    flag: '--port',
    editor: 'input',
    prompt: 'Enter the proxy port number',
    validate: validatePortNumber,
  },
  {
    key: 'apiPort',
    label: 'API port',
    defaultValue: '8897',
    flag: '--api-port',
    editor: 'input',
    prompt: 'Enter the API port number',
    validate: validatePortNumber,
  },
  {
    key: 'ipAddress',
    label: 'IP address',
    defaultValue: '127.0.0.1',
    flag: '--ip-address',
    editor: 'input',
    prompt: 'Enter the IP address to listen on',
    validate: validateIpAddress,
  },
  {
    key: 'asSystemProxy',
    label: 'As system proxy',
    defaultValue: 'Yes',
    flag: '--as-system-proxy',
    editor: 'pick',
    choices: ['Yes', 'No'],
  },
  {
    key: 'installCert',
    label: 'Install certificate',
    defaultValue: 'Yes',
    flag: '--install-cert',
    editor: 'pick',
    choices: ['Yes', 'No'],
  },
  {
    key: 'logLevel',
    label: 'Log level',
    defaultValue: 'information',
    flag: '--log-level',
    editor: 'pick',
    choices: ['trace', 'debug', 'information', 'warning', 'error'],
  },
  {
    key: 'failureRate',
    label: 'Failure rate',
    defaultValue: '50',
    flag: '--failure-rate',
    editor: 'input',
    prompt: 'Enter the failure rate (0-100)',
    validate: validateFailureRate,
  },
  {
    key: 'urlsToWatch',
    label: 'URLs to watch',
    defaultValue: '',
    flag: '--urls-to-watch',
    editor: 'input',
    prompt: 'Enter URLs to watch (space separated). Leave empty to use config file values.',
    placeholder: 'https://api.example.com/* https://graph.microsoft.com/v1.0/*',
  },
  {
    key: 'record',
    label: 'Record',
    defaultValue: 'No',
    flag: '--record',
    editor: 'pick',
    choices: ['No', 'Yes'],
  },
  {
    key: 'noFirstRun',
    label: 'No first run',
    defaultValue: 'No',
    flag: '--no-first-run',
    editor: 'pick',
    choices: ['No', 'Yes'],
  },
  {
    key: 'timeout',
    label: 'Timeout',
    defaultValue: '',
    flag: '--timeout',
    editor: 'input',
    prompt: 'Enter timeout in seconds. Leave empty for no timeout.',
    validate: validateTimeout,
  },
  {
    key: 'watchPids',
    label: 'Watch PIDs',
    defaultValue: '',
    flag: '--watch-pids',
    editor: 'input',
    prompt: 'Enter process IDs to watch (space separated). Leave empty to skip.',
    placeholder: '1234 5678',
    validate: validateWatchPids,
  },
  {
    key: 'watchProcessNames',
    label: 'Watch process names',
    defaultValue: '',
    flag: '--watch-process-names',
    editor: 'input',
    prompt: 'Enter process names to watch (space separated). Leave empty to skip.',
    placeholder: 'msedge chrome',
    validate: validateProcessNames,
  },
];

const startItemLabel = '$(play) Start Dev Proxy';

async function startDevProxyWithOptions(devProxyExe: string): Promise<void> {
  const configDefault = await resolveDefaultConfigFile();
  const options: StartOption[] = startOptionDefaults.map(o => ({
    ...o,
    value: o.key === 'configFile' ? configDefault : o.defaultValue,
    defaultValue: o.key === 'configFile' ? configDefault : o.defaultValue,
  }));

  while (true) {
    const items: vscode.QuickPickItem[] = [
      {
        label: startItemLabel,
        description: 'Launch with the options below',
        alwaysShow: true,
      },
      { label: '', kind: vscode.QuickPickItemKind.Separator },
      ...options.map(o => ({
        label: o.label,
        description: formatOptionValue(o),
      })),
    ];

    const picked = await vscode.window.showQuickPick(items, {
      title: 'Start with Options',
      placeHolder: 'Select an option to change, or start Dev Proxy',
    });

    if (picked === undefined) {
      return;
    }

    if (picked.label === startItemLabel) {
      break;
    }

    const option = options.find(o => o.label === picked.label);
    if (!option) {
      continue;
    }

    const newValue = await editOption(option);
    if (newValue !== undefined) {
      option.value = newValue;
    }
  }

  const args = buildArgs(options);

  const command = [devProxyExe, ...args].join(' ');
  const terminalService = TerminalService.fromConfiguration();
  const terminal = terminalService.getOrCreateTerminal();
  terminalService.sendCommand(terminal, command);
}

function formatOptionValue(option: StartOption): string {
  if (option.key === 'configFile') {
    if (!option.value) {
      return 'devproxyrc.json (install folder)';
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const relativePath = vscode.workspace.asRelativePath(option.value);
      return relativePath + (option.value === option.defaultValue ? ' (default)' : '');
    }
    return path.basename(option.value) + (option.value === option.defaultValue ? ' (default)' : '');
  }
  if (!option.value) {
    return '(not set)';
  }
  if (option.value === option.defaultValue) {
    return `${option.value} (default)`;
  }
  return option.value;
}

async function editOption(option: StartOption): Promise<string | undefined> {
  if (option.editor === 'config') {
    return editConfigFile(option.value);
  }

  if (option.editor === 'pick' && option.choices) {
    const picked = await vscode.window.showQuickPick(option.choices, {
      title: option.label,
      placeHolder: `Select a value for ${option.label}`,
    });
    return picked;
  }

  return vscode.window.showInputBox({
    title: option.label,
    prompt: option.prompt,
    value: option.value,
    placeHolder: option.placeholder,
    validateInput: option.validate,
  });
}

function buildArgs(options: StartOption[]): string[] {
  const args: string[] = [];

  for (const option of options) {
    // Config file: include if set (even if it's the default — user chose it explicitly)
    if (option.key === 'configFile') {
      if (option.value) {
        args.push(option.flag, `"${option.value}"`);
      }
      continue;
    }

    if (option.value === option.defaultValue) {
      continue;
    }

    // Boolean-style flags
    if (option.key === 'asSystemProxy' && option.value === 'No') {
      args.push(option.flag, 'false');
    } else if (option.key === 'installCert' && option.value === 'No') {
      args.push(option.flag, 'false');
    } else if (option.key === 'record' && option.value === 'Yes') {
      args.push(option.flag);
    } else if (option.key === 'noFirstRun' && option.value === 'Yes') {
      args.push(option.flag);
    } else if (option.value.trim()) {
      args.push(option.flag, option.value.trim());
    }
  }

  return args;
}

async function resolveDefaultConfigFile(): Promise<string> {
  // 1. Active editor has a config file open → use that
  const activeConfig = getActiveConfigFilePath();
  if (activeConfig) {
    return activeConfig;
  }

  // 2. devproxyrc.json exists in the workspace → use that
  const workspaceFiles = await vscode.workspace.findFiles('**/devproxyrc.json', '**/node_modules/**', 1);
  if (workspaceFiles.length > 0) {
    return workspaceFiles[0].fsPath;
  }

  // 3. Otherwise empty — Dev Proxy will use its install folder default
  return '';
}

async function findWorkspaceConfigFiles(): Promise<vscode.Uri[]> {
  const jsonFiles = await vscode.workspace.findFiles('**/*.{json,jsonc}', '**/node_modules/**');
  const configFiles: vscode.Uri[] = [];

  for (const uri of jsonFiles) {
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      if (isConfigFile(doc)) {
        configFiles.push(uri);
      }
    } catch {
      // Skip files that can't be opened
    }
  }

  return configFiles;
}

async function editConfigFile(currentValue: string): Promise<string | undefined> {
  const configFiles = await findWorkspaceConfigFiles();

  const items: vscode.QuickPickItem[] = [
    {
      label: '$(home) Use install folder default',
      description: 'devproxyrc.json',
      detail: 'Use the default config file from the Dev Proxy install folder',
    },
  ];

  if (configFiles.length > 0) {
    items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });

    for (const uri of configFiles) {
      const relativePath = vscode.workspace.asRelativePath(uri);
      items.push({
        label: relativePath,
        description: uri.fsPath === currentValue ? '(current)' : undefined,
      });
    }
  }

  const picked = await vscode.window.showQuickPick(items, {
    title: 'Config file',
    placeHolder: 'Select a config file',
  });

  if (picked === undefined) {
    return undefined;
  }

  if (picked.label === '$(home) Use install folder default') {
    return '';
  }

  const match = configFiles.find(uri => vscode.workspace.asRelativePath(uri) === picked.label);
  return match?.fsPath ?? currentValue;
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
