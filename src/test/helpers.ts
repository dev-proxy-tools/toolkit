import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DevProxyInstall } from '../types';

/**
 * Returns the absolute path to a test fixture file.
 * Fixtures live in src/test/examples/ and are referenced directly from source,
 * avoiding the need to copy them to out/ during build.
 */
export function getFixturePath(fileName: string): string {
  const candidateRoots = [
    process.cwd(),
    path.resolve(__dirname, '..', '..'),
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  ].filter((root): root is string => Boolean(root));

  for (const root of candidateRoots) {
    const fixturePath = path.resolve(root, 'src', 'test', 'examples', fileName);
    if (fs.existsSync(fixturePath)) {
      return fixturePath;
    }
  }

  return path.resolve(process.cwd(), 'src', 'test', 'examples', fileName);
}

/**
 * Default Dev Proxy installation state for tests.
 */
export const testDevProxyInstall: DevProxyInstall = {
  isBeta: false,
  isInstalled: true,
  isOutdated: true,
  isRunning: false,
  outdatedVersion: '0.14.1',
  platform: 'win32',
  version: '0.14.1',
};

/**
 * Creates a custom DevProxyInstall for testing specific scenarios.
 */
export function createDevProxyInstall(overrides: Partial<DevProxyInstall>): DevProxyInstall {
  return { ...testDevProxyInstall, ...overrides };
}

/**
 * Gets the extension context, waiting for activation if needed.
 */
export async function getExtensionContext(): Promise<vscode.ExtensionContext> {
  return (await vscode.extensions
    .getExtension('garrytrinder.dev-proxy-toolkit')
    ?.activate()) as vscode.ExtensionContext;
}
