import { DevProxyInstall } from './types';
import os from 'os';
import { VersionExeName, VersionPreference } from './enums';
import { executeCommand } from './utils/shell';
import * as vscode from 'vscode';

export const getVersion = async (devProxyExe: string) => {
    try {
        const version = await executeCommand(`${devProxyExe} --version`);
        const versionLines = version.trim().split('\n');
        const lastLine = versionLines[versionLines.length - 1];
        return lastLine.trim();
    } catch (error) {
        return "";
    }
};

export const detectDevProxyInstall = async (versionPreference: VersionPreference): Promise<DevProxyInstall> => {
    const devProxyExe = getDevProxyExe(versionPreference);
    const version = await getVersion(devProxyExe);
    const isInstalled = version !== '';
    const isBeta = version.includes('beta');
    const platform = os.platform();
    const outdatedVersion = await getOutdatedVersion(devProxyExe);
    const isOutdated = isInstalled && outdatedVersion !== '';
    const isRunning = await isDevProxyRunning(devProxyExe);
    vscode.commands.executeCommand('setContext', 'isDevProxyRunning', isRunning);
    return {
        version,
        isInstalled,
        isBeta,
        platform,
        outdatedVersion,
        isOutdated,
        isRunning
    };
};

export const extractVersionFromOutput = (output: string): string => {
    if (!output) {
        return '';
    }
    
    // Split into lines and look for version information on dedicated lines
    // This avoids extracting versions from file paths like /opt/homebrew/Cellar/dev-proxy/v0.29.1/devproxy-errors.json
    const lines = output.split('\n');
    
    // Look for lines that contain version information (not file paths)
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip lines that contain file paths (indicated by slashes and common path patterns)
        if (trimmedLine.includes('/') || trimmedLine.includes('\\') || trimmedLine.includes('loaded from')) {
            continue;
        }
        
        // Look for version pattern on non-filepath lines
        // Matches: major.minor.patch[-prerelease][+build] but only captures up to prerelease
        const semverRegex = /v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)(?:\+[a-zA-Z0-9.-]+)?/;
        const match = trimmedLine.match(semverRegex);
        if (match) {
            return match[1];
        }
    }
    
    return '';
};

export const getOutdatedVersion = async (devProxyExe: string): Promise<string> => {
    try {
        const outdated = await executeCommand(`${devProxyExe} outdated --short`);
        return extractVersionFromOutput(outdated);
    } catch (error) {
        return "";
    }
};

export const isDevProxyRunning = async (devProxyExe: string): Promise<boolean> => {
    try {
        // Get the API port from configuration
        const configuration = vscode.workspace.getConfiguration('dev-proxy-toolkit');
        const apiPort = configuration.get('apiPort') as number;
        
        // Try to connect to the Dev Proxy API on the configured port
        const response = await fetch(`http://127.0.0.1:${apiPort}/proxy`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000), // 2 second timeout
        });
        
        // If we get any response (even an error), Dev Proxy is running
        return response.status >= 200 && response.status < 500;
    } catch (error) {
        // If the request fails (connection refused, timeout, etc.), Dev Proxy is not running
        return false;
    }
};

export const getDevProxyExe = (versionPreference: VersionPreference) => {
    return versionPreference === VersionPreference.Stable
        ? VersionExeName.Stable
        : VersionExeName.Beta;
};
