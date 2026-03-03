import * as vscode from 'vscode';
import { GlobalStateKeys } from './constants';
import { detectDevProxyInstall } from './detect';
import { VersionPreference } from './enums';
import * as logger from './logger';
import { DevProxyInstall } from './types';

/**
 * One-time migration from legacy camelCase globalState keys to kebab-case.
 */
export const migrateGlobalState = async (context: vscode.ExtensionContext) => {
    const legacyKey = 'devProxyInstall';
    const legacy = context.globalState.get<DevProxyInstall>(legacyKey);
    if (legacy) {
        logger.info('Migrating globalState key from devProxyInstall to dev-proxy-install');
        await context.globalState.update(GlobalStateKeys.devProxyInstall, legacy);
        await context.globalState.update(legacyKey, undefined);
    }
};

export const updateGlobalState = async (context: vscode.ExtensionContext, versionPreference: VersionPreference) => {
    logger.debug('Updating global state');
    const devProxyInstall = await detectDevProxyInstall(versionPreference);
    vscode.commands.executeCommand('setContext', 'isDevProxyInstalled', devProxyInstall.isInstalled);
    context.globalState.update(GlobalStateKeys.devProxyInstall, devProxyInstall);
    logger.info('Global state updated', { isInstalled: devProxyInstall.isInstalled, version: devProxyInstall.version });
};