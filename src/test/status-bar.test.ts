/**
 * Status bar tests.
 * Verifies status bar displays correct state.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as detect from '../detect';
import { VersionPreference } from '../enums';
import { handleStatusBarUpdate, statusBarLoop } from '../status-bar';
import { testDevProxyInstall, getExtensionContext, createDevProxyInstall } from './helpers';

suite('statusbar', () => {
  suiteSetup(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  teardown(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  test('should show error statusbar when devproxy is not installed', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isInstalled: false })
    );
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const updatedStatusBar = handleStatusBarUpdate(context, statusBar);

    const expected = '$(error) Dev Proxy';
    const actual = updatedStatusBar.text;
    assert.strictEqual(actual, expected);
  });

  test('should show warning statusbar when devproxy is not latest version', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isOutdated: true, version: '0.1.0' })
    );
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const updatedStatusBar = handleStatusBarUpdate(context, statusBar);

    const expected = '$(warning) Dev Proxy 0.1.0';
    const actual = updatedStatusBar.text;
    assert.strictEqual(actual, expected);
  });

  test('should show success statusbar when devproxy is installed and latest version', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isOutdated: false, outdatedVersion: '' })
    );
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const updatedStatusBar = handleStatusBarUpdate(context, statusBar);

    const expected = '$(check) Dev Proxy 0.14.1';
    const actual = updatedStatusBar.text;
    assert.strictEqual(actual, expected);
  });

  test('should show radio tower icon when devproxy is running', async () => {
    const stub = sinon.stub(detect, 'isDevProxyRunning').resolves(true);
    const context = await getExtensionContext();
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    await statusBarLoop(context, statusBar, VersionPreference.Stable);

    const expected = '$(radio-tower) Dev Proxy 0.14.1';
    const actual = statusBar.text;
    stub.restore();
    assert.strictEqual(actual, expected);
  });
});
