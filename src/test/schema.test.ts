/**
 * Schema validation tests.
 * Verifies schema version mismatch warnings.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep } from '../utils';
import {
  getFixturePath,
  testDevProxyInstall,
  getExtensionContext,
  createDevProxyInstall,
} from './helpers';

suite('schema', () => {
  setup(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('should show warning when $schema property does not match installed version', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isOutdated: true, version: '0.1.0' })
    );

    const fileName = 'config-schema-mismatch.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = {
      message:
        'Schema version is not compatible with the installed version of Dev Proxy. Expected v0.1.0',
      severity: vscode.DiagnosticSeverity.Warning,
    };
    const actual = {
      message: diagnostics[0]?.message,
      severity: diagnostics[0]?.severity,
    };
    assert.deepStrictEqual(actual, expected);
  });

  test('should not show warning when $schema property matches installed version', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isOutdated: false, outdatedVersion: '', version: '0.24.0' })
    );

    const fileName = 'config-schema-version.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = false;
    const actual = diagnostics.some(diagnostic => {
      return diagnostic.severity === vscode.DiagnosticSeverity.Warning;
    });
    assert.deepStrictEqual(actual, expected);
  });

  test('should show information when urlsToWatch is empty', async () => {
    const fileName = 'config-urls-to-watch-required.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    const expected = {
      message: 'urlsToWatch is empty. Add URLs to intercept requests.',
      severity: vscode.DiagnosticSeverity.Information,
      code: 'emptyUrlsToWatch',
    };
    const diagnostic = diagnostics.find(d => {
      const code =
        typeof d.code === 'object' && d.code !== null
          ? (d.code as { value: string }).value
          : d.code;
      return code === 'emptyUrlsToWatch';
    });
    const diagnosticCode =
      typeof diagnostic?.code === 'object' && diagnostic?.code !== null
        ? (diagnostic.code as { value: string }).value
        : diagnostic?.code;
    const actual = {
      message: diagnostic?.message,
      severity: diagnostic?.severity,
      code: diagnosticCode,
    };
    assert.deepStrictEqual(actual, expected);
  });
});

suite('diagnostic ranges', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('should exclude quotes from string literal ranges', async () => {
    // Test the core functionality by parsing JSON and checking ranges
    const parse = require('json-to-ast');
    const { getRangeFromASTNode } = require('../utils');

    const jsonText = '{"key": "value"}';
    const ast = parse(jsonText);
    const keyNode = ast.children[0];

    // Test our modified range
    const range = getRangeFromASTNode(keyNode.value);
    const modifiedText = jsonText.substring(range.start.character, range.end.character);

    // Verify that the range excludes quotes and extracts just the string content
    assert.strictEqual(
      modifiedText,
      'value',
      'Should extract just the string content without quotes'
    );
  });
});
