/**
 * Plugin diagnostics tests.
 * Verifies plugin validation and code lens functionality.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep } from '../utils';
import { createCodeLensForPluginNodes } from '../code-lens';
import { getFixturePath, testDevProxyInstall, getExtensionContext } from './helpers';

suite('plugins', () => {
  suiteSetup(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('should show error when plugin requires config section', async () => {
    const fileName = 'config-plugin-config-required.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = {
      message: 'GenericRandomErrorPlugin requires a config section.',
      severity: vscode.DiagnosticSeverity.Error,
    };
    const diagnostic = diagnostics.find(diagnostic => {
      return diagnostic.message === expected.message;
    });
    const actual = {
      message: diagnostic?.message,
      severity: diagnostic?.severity,
    };
    assert.deepStrictEqual(actual, expected);
  });

  test('should show warning when disabled plugin requires config section', async () => {
    const fileName = 'config-plugin-config-required-disabled.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = {
      message: 'GenericRandomErrorPlugin requires a config section.',
      severity: vscode.DiagnosticSeverity.Warning,
    };
    const diagnostic = diagnostics.find(diagnostic => {
      return diagnostic.message === expected.message;
    });
    const actual = {
      message: diagnostic?.message,
      severity: diagnostic?.severity,
    };
    assert.deepStrictEqual(actual, expected);
  });

  test('should show error when plugin config section is not defined', async () => {
    const fileName = 'config-plugin-config-missing.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = {
      message:
        "genericRandomErrorPlugin config section is missing. Use 'devproxy-plugin-generic-random-error-config' snippet to create one.",
      severity: vscode.DiagnosticSeverity.Error,
    };
    const diagnostic = diagnostics.find(diagnostic => {
      return diagnostic.message === expected.message;
    });
    const actual = {
      message: diagnostic?.message,
      severity: diagnostic?.severity,
    };
    assert.deepStrictEqual(actual, expected);
  });

  test('should show warning when disabled plugin config section is not defined', async () => {
    const fileName = 'config-plugin-config-missing-disabled.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = {
      message:
        "genericRandomErrorPlugin config section is missing. Use 'devproxy-plugin-generic-random-error-config' snippet to create one.",
      severity: vscode.DiagnosticSeverity.Warning,
    };
    const diagnostic = diagnostics.find(diagnostic => {
      return diagnostic.message === expected.message;
    });
    const actual = {
      message: diagnostic?.message,
      severity: diagnostic?.severity,
    };
    assert.deepStrictEqual(actual, expected);
  });

  test('should show code lens for each plugin', async () => {
    const fileName = 'config-plugins-codelens.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const codeLens = createCodeLensForPluginNodes(document);

    const expected = 2;
    const actual = codeLens.length;
    assert.strictEqual(actual, expected);
  });
});
