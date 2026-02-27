import * as vscode from 'vscode';
import { DevProxyInstall } from './types';
import { Commands } from './constants';
import { findOutdatedConfigFiles } from './utils';

export const handleStartNotification = (context: vscode.ExtensionContext) => {
    const devProxyInstall = context.globalState.get<DevProxyInstall>('devProxyInstall');
    if (!devProxyInstall) {
        return () => {
            const message = `Dev Proxy is not installed, or not in PATH.`;
            return {
                message,
                show: async () => {
                    const result = await vscode.window.showInformationMessage(message, 'Install');
                    if (result === 'Install') {
                        await vscode.commands.executeCommand('dev-proxy-toolkit.install');
                    };
                }
            };
        };
    };
    if (!devProxyInstall.isInstalled) {
        return () => {
            const message = `Dev Proxy is not installed, or not in PATH.`;
            return {
                message,
                show: async () => {
                    const result = await vscode.window.showInformationMessage(message, 'Install');
                    if (result === 'Install') {
                        await vscode.commands.executeCommand('dev-proxy-toolkit.install', devProxyInstall.platform);
                    };
                }
            };
        };
    };
    if (devProxyInstall.isOutdated) {
        return () => {
            const message = `New Dev Proxy version ${devProxyInstall.outdatedVersion} is available.`;
            return {
                message,
                show: async () => {
                    const result = await vscode.window.showInformationMessage(message, 'Upgrade');
                    if (result === 'Upgrade') {
                        await vscode.commands.executeCommand('dev-proxy-toolkit.upgrade');
                    };
                }
            };
        };
    };
};

export const processNotification = (notification: (() => { message: string; show: () => Promise<void>; }) | undefined) => {
    if (notification) { notification().show(); };
};

/**
 * Check for outdated config files and notify the user.
 *
 * Scans the workspace for Dev Proxy config files whose schema version
 * doesn't match the installed Dev Proxy version and offers to upgrade
 * them using Copilot Chat.
 */
export async function handleOutdatedConfigFilesNotification(
    context: vscode.ExtensionContext,
): Promise<void> {
    const devProxyInstall = context.globalState.get<DevProxyInstall>('devProxyInstall');
    if (!devProxyInstall?.isInstalled) {
        return;
    }

    const devProxyVersion = devProxyInstall.isBeta
        ? devProxyInstall.version.split('-')[0]
        : devProxyInstall.version;

    const outdatedFiles = await findOutdatedConfigFiles(devProxyVersion);

    if (outdatedFiles.length === 0) {
        return;
    }

    const fileCount = outdatedFiles.length;
    const fileWord = fileCount === 1 ? 'file' : 'files';
    const message = `${fileCount} Dev Proxy config ${fileWord} found with a schema version that doesn't match the installed version (v${devProxyVersion}).`;

    const result = await vscode.window.showWarningMessage(
        message,
        'Upgrade with Copilot',
        'Dismiss',
    );

    if (result === 'Upgrade with Copilot') {
        await vscode.commands.executeCommand(Commands.upgradeConfigs, outdatedFiles);
    }
}
