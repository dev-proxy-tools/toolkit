/**
 * Config file detection tests.
 * Verifies isConfigFile correctly identifies Dev Proxy configuration files.
 * Verifies extractVersionFromSchemaUrl correctly extracts versions from schema URLs.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { isConfigFile, extractVersionFromSchemaUrl, sleep } from '../utils';
import { getFixturePath, testDevProxyInstall, getExtensionContext } from './helpers';

suite('isConfigFile', () => {
  setup(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('should return true if file is named devproxyrc.json', async () => {
    const fileName = 'devproxyrc.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);

    const expected = true;
    const actual = isConfigFile(document);
    assert.strictEqual(actual, expected);
  });

  test('should return true if file contains $schema property value that contains dev-proxy and ends with rc.schema.json', async () => {
    const fileName = 'config-schema.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);

    const expected = true;
    const actual = isConfigFile(document);
    assert.strictEqual(actual, expected);
  });

  test('should return false if file contains $schema property value that does not contain dev-proxy or end with rc.schema.json', async () => {
    const fileName = 'config-incorrect-schema.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);

    const expected = false;
    const actual = isConfigFile(document);
    assert.strictEqual(actual, expected);
  });

  test('should return true if file contains plugins array', async () => {
    const fileName = 'config-plugins.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);

    const expected = true;
    const actual = isConfigFile(document);
    assert.strictEqual(actual, expected);
  });

  test('should return false if file does not contain plugins array', async () => {
    const fileName = 'foo.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);

    const expected = false;
    const actual = isConfigFile(document);
    assert.strictEqual(actual, expected);
  });

  test('should return false if file contains $schema property value that does not contain dev-proxy or end with rc.schema.json but contains plugins array', async () => {
    const fileName = 'config-incorrect-schema-with-plugins.json';
    const filePath = getFixturePath(fileName);
    const document = await vscode.workspace.openTextDocument(filePath);
    await sleep(1000);

    const expected = false;
    const actual = isConfigFile(document);
    assert.strictEqual(actual, expected);
  });
});

suite('extractVersionFromSchemaUrl', () => {
  test('should extract version from standard schema URL', () => {
    const url = 'https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas/v0.24.0/rc.schema.json';
    assert.strictEqual(extractVersionFromSchemaUrl(url), '0.24.0');
  });

  test('should extract version from legacy schema URL', () => {
    const url = 'https://raw.githubusercontent.com/microsoft/dev-proxy/main/schemas/v0.14.1/rc.schema.json';
    assert.strictEqual(extractVersionFromSchemaUrl(url), '0.14.1');
  });

  test('should extract pre-release version from schema URL', () => {
    const url = 'https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas/v0.24.0-beta.1/rc.schema.json';
    assert.strictEqual(extractVersionFromSchemaUrl(url), '0.24.0-beta.1');
  });

  test('should return empty string for URL without version', () => {
    const url = 'https://example.com/schema.json';
    assert.strictEqual(extractVersionFromSchemaUrl(url), '');
  });

  test('should return empty string for empty string', () => {
    assert.strictEqual(extractVersionFromSchemaUrl(''), '');
  });
});
