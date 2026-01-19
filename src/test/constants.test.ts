/**
 * Constants tests.
 * Tests for utility functions in constants.
 */
import * as assert from 'assert';
import { getSchemaUrl, Commands, ContextKeys, DiagnosticCodes, Urls } from '../constants';

suite('getSchemaUrl', () => {
  test('should build correct schema URL for version', () => {
    const result = getSchemaUrl('0.24.0');
    assert.strictEqual(
      result,
      'https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas/v0.24.0/rc.schema.json'
    );
  });

  test('should build correct schema URL for beta version', () => {
    const result = getSchemaUrl('0.25.0-beta.1');
    assert.strictEqual(
      result,
      'https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas/v0.25.0-beta.1/rc.schema.json'
    );
  });
});

suite('Commands registry', () => {
  test('should have all expected command IDs', () => {
    // Verify all commands exist and have correct prefix
    const commandIds = Object.values(Commands) as string[];
    assert.ok(commandIds.length > 0, 'Should have at least one command');

    for (const id of commandIds) {
      assert.ok(
        id.startsWith('dev-proxy-toolkit.'),
        `Command ${id} should start with dev-proxy-toolkit.`
      );
    }
  });

  test('should have unique command IDs', () => {
    const commandIds = Object.values(Commands) as string[];
    const uniqueIds = new Set(commandIds);
    assert.strictEqual(uniqueIds.size, commandIds.length, 'All command IDs should be unique');
  });

  test('should include core lifecycle commands', () => {
    assert.ok(Commands.start, 'Should have start command');
    assert.ok(Commands.stop, 'Should have stop command');
    assert.ok(Commands.restart, 'Should have restart command');
  });

  test('should include recording commands', () => {
    assert.ok(Commands.recordStart, 'Should have record start command');
    assert.ok(Commands.recordStop, 'Should have record stop command');
    assert.ok(Commands.raiseMock, 'Should have raise mock command');
  });

  test('should include config commands', () => {
    assert.ok(Commands.configOpen, 'Should have config open command');
    assert.ok(Commands.configNew, 'Should have config new command');
  });
});

suite('ContextKeys', () => {
  test('should have all expected context keys', () => {
    assert.ok(ContextKeys.isInstalled, 'Should have isInstalled key');
    assert.ok(ContextKeys.isRunning, 'Should have isRunning key');
    assert.ok(ContextKeys.isRecording, 'Should have isRecording key');
    assert.ok(ContextKeys.isConfigFile, 'Should have isConfigFile key');
  });
});

suite('DiagnosticCodes', () => {
  test('should have all expected diagnostic codes', () => {
    assert.ok(DiagnosticCodes.invalidSchema, 'Should have invalidSchema code');
    assert.ok(DiagnosticCodes.invalidConfigSection, 'Should have invalidConfigSection code');
    assert.ok(DiagnosticCodes.deprecatedPluginPath, 'Should have deprecatedPluginPath code');
    assert.ok(DiagnosticCodes.missingLanguageModel, 'Should have missingLanguageModel code');
    assert.ok(DiagnosticCodes.noEnabledPlugins, 'Should have noEnabledPlugins code');
    assert.ok(DiagnosticCodes.reporterPosition, 'Should have reporterPosition code');
    assert.ok(DiagnosticCodes.summaryWithoutReporter, 'Should have summaryWithoutReporter code');
    assert.ok(DiagnosticCodes.apiCenterPluginOrder, 'Should have apiCenterPluginOrder code');
    assert.ok(DiagnosticCodes.emptyUrlsToWatch, 'Should have emptyUrlsToWatch code');
    assert.ok(DiagnosticCodes.pluginConfigMissing, 'Should have pluginConfigMissing code');
    assert.ok(DiagnosticCodes.pluginConfigRequired, 'Should have pluginConfigRequired code');
    assert.ok(DiagnosticCodes.pluginConfigNotRequired, 'Should have pluginConfigNotRequired code');
  });
});

suite('Urls', () => {
  test('should have valid URL formats', () => {
    assert.ok(Urls.upgradeDoc.startsWith('https://'), 'upgradeDoc should be HTTPS');
    assert.ok(Urls.linuxInstall.startsWith('https://'), 'linuxInstall should be HTTPS');
    assert.ok(Urls.schemaBase.startsWith('https://'), 'schemaBase should be HTTPS');
  });
});
