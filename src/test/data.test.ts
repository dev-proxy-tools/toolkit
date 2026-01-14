/**
 * Data module tests.
 * Tests for plugin data utility functions.
 */
import * as assert from 'assert';
import {
  getPluginNames,
  isKnownPlugin,
  getPluginDocUrl,
  getLanguageModelPlugins,
  getPluginsRequiringConfig,
  pluginSnippets,
  pluginDocs,
} from '../data';

suite('getPluginNames', () => {
  test('should return an array of plugin names', () => {
    const names = getPluginNames();
    assert.ok(Array.isArray(names), 'Should return an array');
    assert.ok(names.length > 0, 'Should have at least one plugin');
  });

  test('should include known plugins', () => {
    const names = getPluginNames();
    assert.ok(names.includes('MockResponsePlugin'), 'Should include MockResponsePlugin');
    assert.ok(names.includes('RateLimitingPlugin'), 'Should include RateLimitingPlugin');
    assert.ok(names.includes('LatencyPlugin'), 'Should include LatencyPlugin');
  });
});

suite('isKnownPlugin', () => {
  test('should return true for known plugins', () => {
    assert.strictEqual(isKnownPlugin('MockResponsePlugin'), true);
    assert.strictEqual(isKnownPlugin('RateLimitingPlugin'), true);
    assert.strictEqual(isKnownPlugin('GraphRandomErrorPlugin'), true);
  });

  test('should return false for unknown plugins', () => {
    assert.strictEqual(isKnownPlugin('NonExistentPlugin'), false);
    assert.strictEqual(isKnownPlugin(''), false);
    assert.strictEqual(isKnownPlugin('mockresponseplugin'), false); // case sensitive
  });
});

suite('getPluginDocUrl', () => {
  test('should return URL for known plugins', () => {
    const url = getPluginDocUrl('MockResponsePlugin');
    assert.ok(url, 'Should return a URL');
    assert.ok(url.startsWith('https://'), 'URL should be HTTPS');
    assert.ok(url.includes('learn.microsoft.com'), 'Should be Microsoft Learn URL');
  });

  test('should return undefined for unknown plugins', () => {
    const url = getPluginDocUrl('NonExistentPlugin');
    assert.strictEqual(url, undefined);
  });
});

suite('getLanguageModelPlugins', () => {
  test('should return array of plugins requiring language model', () => {
    const plugins = getLanguageModelPlugins();
    assert.ok(Array.isArray(plugins), 'Should return an array');
  });

  test('should include known language model plugins', () => {
    const plugins = getLanguageModelPlugins();
    assert.ok(
      plugins.includes('LanguageModelFailurePlugin'),
      'Should include LanguageModelFailurePlugin'
    );
    assert.ok(
      plugins.includes('LanguageModelRateLimitingPlugin'),
      'Should include LanguageModelRateLimitingPlugin'
    );
  });

  test('should not include non-language-model plugins', () => {
    const plugins = getLanguageModelPlugins();
    assert.ok(!plugins.includes('MockResponsePlugin'), 'Should not include MockResponsePlugin');
    assert.ok(!plugins.includes('LatencyPlugin'), 'Should not include LatencyPlugin');
  });
});

suite('getPluginsRequiringConfig', () => {
  test('should return array of plugins requiring config', () => {
    const plugins = getPluginsRequiringConfig();
    assert.ok(Array.isArray(plugins), 'Should return an array');
  });

  test('should include plugins with required config', () => {
    const plugins = getPluginsRequiringConfig();
    // Check plugins that have config.required = true in plugins.json
    assert.ok(plugins.includes('MockResponsePlugin'), 'Should include MockResponsePlugin');
  });

  test('should not include plugins without required config', () => {
    const plugins = getPluginsRequiringConfig();
    // Plugins without required config shouldn't be in the list
    assert.ok(!plugins.includes('RetryAfterPlugin'), 'Should not include RetryAfterPlugin');
  });
});

suite('pluginSnippets', () => {
  test('should have snippet data for plugins', () => {
    assert.ok(pluginSnippets, 'pluginSnippets should be defined');
    assert.ok(Object.keys(pluginSnippets).length > 0, 'Should have at least one plugin');
  });

  test('should have instance property for each plugin', () => {
    for (const [name, config] of Object.entries(pluginSnippets)) {
      assert.ok(config.instance, `${name} should have instance property`);
      assert.ok(
        config.instance.startsWith('devproxy-'),
        `${name} instance should start with devproxy-`
      );
    }
  });
});

suite('pluginDocs', () => {
  test('should have documentation for plugins', () => {
    assert.ok(pluginDocs, 'pluginDocs should be defined');
    assert.ok(Object.keys(pluginDocs).length > 0, 'Should have at least one plugin doc');
  });

  test('should have valid URLs for each plugin', () => {
    for (const [name, doc] of Object.entries(pluginDocs)) {
      assert.ok(doc.url, `${name} should have url property`);
      assert.ok(doc.url.startsWith('https://'), `${name} URL should be HTTPS`);
    }
  });
});
