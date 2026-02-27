import * as vscode from 'vscode';
import { detectDevProxyInstall } from './detect';
import { VersionPreference } from './enums';
import * as logger from './logger';

export const updateGlobalState = async (context: vscode.ExtensionContext, versionPreference: VersionPreference) => {
    logger.debug('Updating global state');
    const devProxyInstall = await detectDevProxyInstall(versionPreference);
    vscode.commands.executeCommand('setContext', 'isDevProxyInstalled', devProxyInstall.isInstalled);
    context.globalState.update('devProxyInstall', devProxyInstall);
    logger.debug('Global state updated', { isInstalled: devProxyInstall.isInstalled, version: devProxyInstall.version });
};