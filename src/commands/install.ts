import * as vscode from 'vscode';
import { Commands } from '../constants';
import {
  executeCommand,
  getPackageIdentifier,
  getInstallScriptUrl,
  upgradeDevProxyWithPackageManager,
  openUpgradeDocumentation,
} from '../utils/shell';
import { PackageManager, VersionPreference } from '../enums';

/**
 * Installation and upgrade commands.
 */

export function registerInstallCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.install, (platform: NodeJS.Platform) =>
      installDevProxy(platform, configuration)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.upgrade, () => upgradeDevProxy(configuration))
  );
}

async function installDevProxy(
  platform: NodeJS.Platform,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  const message = vscode.window.setStatusBarMessage('Installing Dev Proxy...');
  const versionPreference = configuration.get('version') as VersionPreference;

  try {
    if (platform === 'win32') {
      await installOnWindows(versionPreference);
    } else if (platform === 'darwin') {
      await installOnMac(versionPreference);
    } else if (platform === 'linux') {
      await installOnLinux(versionPreference);
    }
  } finally {
    message.dispose();
  }
}

async function installOnWindows(versionPreference: VersionPreference): Promise<void> {
  const packageId = getPackageIdentifier(versionPreference, PackageManager.Winget);

  // Check if winget is available
  try {
    await executeCommand('winget --version');
  } catch {
    vscode.window.showErrorMessage('Winget is not installed. Please install winget and try again.');
    return;
  }

  try {
    await executeCommand(`winget install ${packageId} --silent`);
    const result = await vscode.window.showInformationMessage('Dev Proxy installed.', 'Reload');
    if (result === 'Reload') {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to install Dev Proxy.\n${error}`);
  }
}

async function installOnMac(versionPreference: VersionPreference): Promise<void> {
  const packageId = getPackageIdentifier(versionPreference, PackageManager.Homebrew);

  // Check if brew is available
  try {
    await executeCommand('brew --version');
  } catch {
    vscode.window.showErrorMessage('Homebrew is not installed. Please install brew and try again.');
    return;
  }

  try {
    await executeCommand('brew tap dotnet/dev-proxy');
    await executeCommand(`brew install ${packageId}`);
    const result = await vscode.window.showInformationMessage('Dev Proxy installed.', 'Reload');
    if (result === 'Reload') {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to install Dev Proxy.\n${error}`);
  }
}

async function checkLinuxPrerequisites(): Promise<boolean> {
  try {
    await executeCommand('bash --version');
  } catch {
    vscode.window.showErrorMessage('Bash is not available. Please install Bash and try again.');
    return false;
  }

  try {
    await executeCommand('curl --version');
  } catch {
    vscode.window.showErrorMessage('curl is not installed. Please install curl and try again.');
    return false;
  }

  return true;
}

function buildLinuxInstallCommand(scriptUrl: string): string {
  return `bash -c "$(curl -sL ${scriptUrl})"`;
}

async function installOnLinux(versionPreference: VersionPreference): Promise<void> {
  if (!(await checkLinuxPrerequisites())) {
    return;
  }

  const scriptUrl = getInstallScriptUrl(versionPreference);

  try {
    await executeCommand(buildLinuxInstallCommand(scriptUrl));
    const result = await vscode.window.showInformationMessage('Dev Proxy installed.', 'Reload');
    if (result === 'Reload') {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to install Dev Proxy.\n${error}`);
  }
}

async function upgradeDevProxy(configuration: vscode.WorkspaceConfiguration): Promise<void> {
  const platform = process.platform;
  const versionPreference = configuration.get('version') as VersionPreference;
  const isBeta = versionPreference === VersionPreference.Beta;

  // Linux uses install script to upgrade
  if (platform === 'linux') {
    if (!(await checkLinuxPrerequisites())) {
      openUpgradeDocumentation();
      return;
    }

    const scriptUrl = getInstallScriptUrl(versionPreference);
    const versionText = isBeta ? 'Dev Proxy Beta' : 'Dev Proxy';
    const statusMessage = vscode.window.setStatusBarMessage(`Upgrading ${versionText}...`);

    try {
      await executeCommand(buildLinuxInstallCommand(scriptUrl));
      statusMessage.dispose();

      const result = await vscode.window.showInformationMessage(
        `${versionText} has been successfully upgraded!`,
        'Reload Window'
      );
      if (result === 'Reload Window') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    } catch {
      statusMessage.dispose();
      openUpgradeDocumentation();
    }
    return;
  }

  if (platform === 'win32') {
    const packageId = getPackageIdentifier(versionPreference, PackageManager.Winget);
    if (!packageId) {
      openUpgradeDocumentation();
      return;
    }

    const upgradeCommand = `winget upgrade ${packageId} --silent`;
    const upgraded = await upgradeDevProxyWithPackageManager(
      'winget',
      packageId,
      upgradeCommand,
      isBeta
    );
    if (!upgraded) {
      openUpgradeDocumentation();
    }
    return;
  }

  if (platform === 'darwin') {
    const packageId = getPackageIdentifier(versionPreference, PackageManager.Homebrew);
    if (!packageId) {
      openUpgradeDocumentation();
      return;
    }

    const upgradeCommand = `brew upgrade ${packageId}`;
    const upgraded = await upgradeDevProxyWithPackageManager(
      'brew',
      packageId,
      upgradeCommand,
      isBeta
    );
    if (!upgraded) {
      openUpgradeDocumentation();
    }
    return;
  }

  // Unknown platform
  openUpgradeDocumentation();
}
