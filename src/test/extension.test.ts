/**
 * Extension activation tests.
 * Verifies the extension loads and activates properly.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep } from '../utils';

suite('extension', () => {
  suiteSetup(async () => {
    do {
      await sleep(1000);
    } while (!vscode.extensions.getExtension('garrytrinder.dev-proxy-toolkit')?.isActive);
  });

  test('should activate', async () => {
    const expected = true;
    const actual = vscode.extensions.getExtension('garrytrinder.dev-proxy-toolkit')?.isActive;
    assert.strictEqual(actual, expected);
  });
});

suite('Commands', () => {
  test('JWT create command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    const jwtCreateCommand = commands.find(cmd => cmd === 'dev-proxy-toolkit.jwt-create');
    assert.ok(jwtCreateCommand, 'JWT create command should be registered');
  });
});

