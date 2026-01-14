import { exec, ExecOptions } from 'child_process';
import * as vscode from 'vscode';
import { Urls } from '../constants/commands';
import {
  HomebrewPackageIdentifier,
  PackageManager,
  VersionPreference,
  WingetPackageIdentifier,
} from '../enums';

/**
 * Utility functions for shell execution and package management.
 */

/**
 * Execute a shell command and return the output.
 */
export async function executeCommand(cmd: string, options: ExecOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        reject(`exec error: ${error}${stderr ? `\nstderr: ${stderr.toString()}` : ''}`);
      } else {
        resolve(stdout.toString());
      }
    });
  });
}

/**
 * Sleep for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the package identifier for a specific package manager.
 */
export function getPackageIdentifier(
  versionPreference: VersionPreference,
  packageManager: PackageManager
): string | undefined {
  if (packageManager === PackageManager.Homebrew) {
    return versionPreference === VersionPreference.Stable
      ? HomebrewPackageIdentifier.Stable
      : HomebrewPackageIdentifier.Beta;
  }

  if (packageManager === PackageManager.Winget) {
    return versionPreference === VersionPreference.Stable
      ? WingetPackageIdentifier.Stable
      : WingetPackageIdentifier.Beta;
  }

  return undefined;
}

/**
 * Upgrade Dev Proxy using a package manager.
 *
 * @returns true if upgrade was successful, false otherwise
 */
export async function upgradeDevProxyWithPackageManager(
  packageManager: string,
  packageId: string,
  upgradeCommand: string,
  isBeta = false
): Promise<boolean> {
  try {
    // Check if package manager is available
    await executeCommand(`${packageManager} --version`);

    // Check if Dev Proxy is installed via package manager
    const listCommand =
      packageManager === 'winget' ? `winget list ${packageId}` : 'brew list --formula';
    const listOutput = await executeCommand(listCommand);

    if (!listOutput.includes(packageId)) {
      return false;
    }

    // Refresh package lists before upgrading
    const updateMessage = vscode.window.setStatusBarMessage('Updating package lists...');

    try {
      const updateCommand = packageManager === 'winget' ? 'winget source update' : 'brew update';
      await executeCommand(updateCommand);
    } catch (error) {
      vscode.window.showWarningMessage(`Failed to update package lists: ${error}`);
      // Continue with upgrade even if update fails
    } finally {
      updateMessage.dispose();
    }

    // Proceed with upgrade
    const versionText = isBeta ? 'Dev Proxy Beta' : 'Dev Proxy';
    const statusMessage = vscode.window.setStatusBarMessage(`Upgrading ${versionText}...`);

    try {
      await executeCommand(upgradeCommand);
      statusMessage.dispose();

      const result = await vscode.window.showInformationMessage(
        `${versionText} has been successfully upgraded!`,
        'Reload Window'
      );
      if (result === 'Reload Window') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
      return true;
    } catch (error) {
      statusMessage.dispose();
      vscode.window.showErrorMessage(`Failed to upgrade ${versionText}: ${error}`);
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Open the Dev Proxy upgrade documentation in the browser.
 */
export function openUpgradeDocumentation(): void {
  vscode.env.openExternal(vscode.Uri.parse(Urls.upgradeDoc));
}
