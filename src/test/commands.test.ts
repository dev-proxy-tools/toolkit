/**
 * Command registration tests.
 * Verifies all commands are properly registered with VS Code.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { Commands } from '../constants';

suite('Command Registration', () => {
  let registeredCommands: string[];

  suiteSetup(async () => {
    // Get all registered commands once for the suite
    registeredCommands = await vscode.commands.getCommands();
  });

  test('start command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.start),
      `Command ${Commands.start} should be registered`
    );
  });

  test('stop command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.stop),
      `Command ${Commands.stop} should be registered`
    );
  });

  test('restart command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.restart),
      `Command ${Commands.restart} should be registered`
    );
  });

  test('record-start command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.recordStart),
      `Command ${Commands.recordStart} should be registered`
    );
  });

  test('record-stop command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.recordStop),
      `Command ${Commands.recordStop} should be registered`
    );
  });

  test('raise-mock command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.raiseMock),
      `Command ${Commands.raiseMock} should be registered`
    );
  });

  test('config-open command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.configOpen),
      `Command ${Commands.configOpen} should be registered`
    );
  });

  test('config-new command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.configNew),
      `Command ${Commands.configNew} should be registered`
    );
  });

  test('discover-urls-to-watch command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.discoverUrls),
      `Command ${Commands.discoverUrls} should be registered`
    );
  });

  test('install command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.install),
      `Command ${Commands.install} should be registered`
    );
  });

  test('upgrade command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.upgrade),
      `Command ${Commands.upgrade} should be registered`
    );
  });

  test('jwt-create command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.jwtCreate),
      `Command ${Commands.jwtCreate} should be registered`
    );
  });

  test('openPluginDoc command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.openPluginDoc),
      `Command ${Commands.openPluginDoc} should be registered`
    );
  });

  test('addLanguageModelConfig command should be registered', () => {
    assert.ok(
      registeredCommands.includes(Commands.addLanguageModelConfig),
      `Command ${Commands.addLanguageModelConfig} should be registered`
    );
  });

  test('all Commands constants should be registered', () => {
    const allCommandIds = Object.values(Commands) as string[];
    const missingCommands = allCommandIds.filter(id => !registeredCommands.includes(id));

    assert.deepStrictEqual(
      missingCommands,
      [],
      `All commands should be registered. Missing: ${missingCommands.join(', ')}`
    );
  });
});
