import * as vscode from 'vscode';
import parse from 'json-to-ast';
import {exec, ExecOptions} from 'child_process';
import {
  HomebrewPackageIdentifier,
  PackageManager,
  VersionPreference,
  WingetPackageIdentifier,
} from './enums';

export const getASTNode = (
  children: parse.PropertyNode[],
  type: string,
  keyValue: string
) => {
  return children.find(
    child => child.key.type === type && child.key.value === keyValue
  );
};

export const getRangeFromASTNode = (
  node:
    | parse.PropertyNode
    | parse.LiteralNode
    | parse.ObjectNode
    | parse.ValueNode
) => {
  const startLine = node?.loc?.start.line || 0;
  const endLine = node?.loc?.end.line || 0;
  let startColumn = node?.loc?.start.column || 0;
  let endColumn = node?.loc?.end.column || 0;

  // For string literals, exclude the surrounding quotes from the range
  // The json-to-ast library uses 1-based column numbers, but we need 0-based for VS Code
  // For string literals: column points to the quote, we want to point to the content
  if (node.type === 'Literal' && typeof (node as parse.LiteralNode).value === 'string') {
    // Convert to 0-based and adjust for quotes:
    // Start: column is 1-based pointing to quote, so column-1+1 = column (no change)
    // End: column is 1-based pointing after quote, so column-1-1 = column-2
    startColumn = startColumn; // column already points to quote, no change needed for 0-based + skip quote
    endColumn = endColumn - 2; // convert to 0-based and skip closing quote
  } else {
    // For non-string literals, just convert from 1-based to 0-based
    startColumn = startColumn - 1;
    endColumn = endColumn - 1;
  }

  // we remove 1 from the line numbers because vscode uses 0 based line numbers
  return new vscode.Range(
    new vscode.Position(startLine - 1, startColumn),
    new vscode.Position(endLine - 1, endColumn)
  );
};

export const getStartPositionFromASTNode = (
  node:
    | parse.PropertyNode
    | parse.LiteralNode
    | parse.ObjectNode
    | parse.ValueNode
) => {
  const startLine = node?.loc?.start.line || 0;
  const startColumn = node?.loc?.start.column || 0;

  return new vscode.Position(startLine - 1, startColumn);
};

export const isConfigFile = (document: vscode.TextDocument) => {
  let isConfigFile = false;

  const fileName = document.fileName.toLowerCase();
  if (!(fileName.endsWith('.json') || fileName.endsWith('.jsonc'))) {
    return false;
  }

  const documentNode = parse(document.getText()) as parse.ObjectNode;

  // we know that its a config file if
  // 1. the file name is devproxy.config.json
  if (document.fileName.endsWith('devproxyrc.json')) {
    isConfigFile = true;
  }

  // 2. the file contains a $schema property that contains dev-proxy and ends with rc.schema.json
  const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');
  if (schemaNode) {
    const schema = (schemaNode?.value as parse.LiteralNode).value as string;
    if (schema.includes('dev-proxy') && schema.endsWith('rc.schema.json')) {
      isConfigFile = true;
    }
  }

  // 3. the file contains plugins array, as $schema is optional
  const pluginsNode = getASTNode(
    documentNode.children,
    'Identifier',
    'plugins'
  );

  if (pluginsNode && pluginsNode.value.type === 'Array') {
    isConfigFile = true;
  }

  return isConfigFile;
};

export const isProxyFile = (document: vscode.TextDocument) => {
  let isProxyFile = false;
  const documentNode = parse(document.getText()) as parse.ObjectNode;

  const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');
  if (schemaNode) {
    const schema = (schemaNode?.value as parse.LiteralNode).value as string;
    if (schema.includes('dev-proxy') && schema.endsWith('.schema.json')) {
      isProxyFile = true;
    }
  }
  return isProxyFile;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

export const executeCommand = async (cmd: string, options: ExecOptions = {}): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        // Command failed with non-zero exit code
        reject(`exec error: ${error}${stderr ? `\nstderr: ${stderr.toString()}` : ''}`);
      } else {
        // Command succeeded (exit code 0), return stdout
        // Note: Many tools like brew send informational messages to stderr even on success
        resolve(stdout.toString());
      }
    });
  });
};

export const upgradeDevProxyWithPackageManager = async (
  packageManager: string,
  packageId: string,
  upgradeCommand: string,
  isBeta: boolean = false,
): Promise<boolean> => {
  try {
    // Check if package manager is available
    await executeCommand(`${packageManager} --version`);

    // Check if Dev Proxy is installed via package manager
    const listCommand =
      packageManager === 'winget'
        ? `winget list ${packageId}`
        : 'brew list --formula';
    const listOutput = await executeCommand(listCommand);

    if (!listOutput.includes(packageId)) {
      return false;
    }

    // Refresh package lists before upgrading
    const updateMessage = vscode.window.setStatusBarMessage(
      `Updating package lists...`,
    );

    try {
      const updateCommand =
        packageManager === 'winget'
          ? 'winget source update'
          : 'brew update';
      await executeCommand(updateCommand);
      updateMessage.dispose();
    } catch (error) {
      updateMessage.dispose();
      vscode.window.showWarningMessage(`Failed to update package lists: ${error}`);
      // Continue with upgrade even if update fails
    }

    // Proceed with upgrade
    const versionText = isBeta ? 'Dev Proxy Beta' : 'Dev Proxy';
    const statusMessage = vscode.window.setStatusBarMessage(
      `Upgrading ${versionText}...`,
    );

    try {
      await executeCommand(upgradeCommand);
      statusMessage.dispose();

      const result = await vscode.window.showInformationMessage(
        `${versionText} has been successfully upgraded!`,
        'Reload Window',
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
  } catch (error) {
    return false;
  }
};

export const openUpgradeDocumentation = () => {
  const url = 'https://aka.ms/devproxy/upgrade';
  vscode.env.openExternal(vscode.Uri.parse(url));
};

export const getPackageIdentifier = (
  versionPreference: VersionPreference,
  packageManager: PackageManager,
): string | undefined => {
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
};
