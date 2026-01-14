import * as vscode from 'vscode';
import { DevProxyInstall } from './types';
import { getDevProxyExe, isDevProxyRunning } from './detect';
import { VersionPreference } from './enums';

export const createStatusBar = (context: vscode.ExtensionContext): vscode.StatusBarItem => {
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(loading~spin) Dev Proxy';
    statusBar.show();
    context.subscriptions.push(statusBar);
    return statusBar;
};

export const updateStatusBar = (context: vscode.ExtensionContext, statusBar: vscode.StatusBarItem) => {
    statusBar = handleStatusBarUpdate(context, statusBar);
};

export const handleStatusBarUpdate = (context: vscode.ExtensionContext, statusBar: vscode.StatusBarItem): vscode.StatusBarItem => {
    const devProxyInstall = context.globalState.get<DevProxyInstall>('devProxyInstall');
    if (!devProxyInstall) { return statusBar; }
    if (!devProxyInstall.isInstalled) {
        statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBar.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        statusBar.text = `$(error) Dev Proxy`;
        statusBar.tooltip = `Dev Proxy is not installed`;
    }
    if (devProxyInstall.isInstalled && !devProxyInstall.isOutdated) {
        statusBar.backgroundColor = new vscode.ThemeColor('statusBar.background');
        statusBar.color = new vscode.ThemeColor('statusBar.foreground');
        statusBar.text = `$(check) Dev Proxy ${devProxyInstall.version}`;
        statusBar.tooltip = `You have the latest version installed`;
    }
    if (devProxyInstall.isInstalled && devProxyInstall.isOutdated) {
        statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        statusBar.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        statusBar.text = `$(warning) Dev Proxy ${devProxyInstall.version}`;
        statusBar.tooltip = `An update is available`;
    }
    if (devProxyInstall.isRunning) {
        statusBar.text = `$(radio-tower) Dev Proxy ${devProxyInstall.version}`;
        statusBar.tooltip = 'Dev Proxy is active';
        statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        statusBar.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    }
    return statusBar;
};

export const statusBarLoop = async (context: vscode.ExtensionContext, statusBar: vscode.StatusBarItem, versionPreference: VersionPreference) => {
    try {
        // Check if the context is still valid
        if (!context || !statusBar) {
            return;
        }

        const devProxyExe = getDevProxyExe(versionPreference);
        const isRunning = await isDevProxyRunning(devProxyExe);
        const globalState = context.globalState.get<DevProxyInstall>('devProxyInstall');
        
        // Only update if context is still valid
        if (context.globalState) {
            await context.globalState.update('devProxyInstall', { ...globalState, isRunning });
            vscode.commands.executeCommand('setContext', 'isDevProxyRunning', isRunning);
            updateStatusBar(context, statusBar);
        }
    } catch (error) {
        // Log but don't throw to prevent extension crashes
        console.error('Error in statusBarLoop:', error);
    }
};
