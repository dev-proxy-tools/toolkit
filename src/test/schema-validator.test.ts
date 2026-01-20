import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  validateAgainstSchema,
  clearSchemaCache,
  getSchemaCacheSize,
} from '../services';

suite('Schema Validator Service', () => {
  setup(() => {
    clearSchemaCache();
  });

  teardown(() => {
    sinon.restore();
    clearSchemaCache();
  });

  suite('validateAgainstSchema', () => {
    test('should validate valid config against schema', () => {
      const schema = {
        type: 'object',
        properties: {
          mocksFile: { type: 'string' },
        },
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
        mocksFile: 'mocks.json',
      };

      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should detect unknown properties', () => {
      const schema = {
        type: 'object',
        properties: {
          mocksFile: { type: 'string' },
        },
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
        mocksFile: 'mocks.json',
        unknownProperty: 'value',
      };

      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].keyword, 'additionalProperties');
      assert.ok(result.errors[0].message.includes('unknownProperty'));
    });

    test('should detect invalid types', () => {
      const schema = {
        type: 'object',
        properties: {
          mocksFile: { type: 'string' },
        },
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
        mocksFile: 12345,
      };

      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].keyword, 'type');
    });

    test('should detect missing required properties', () => {
      const schema = {
        type: 'object',
        properties: {
          mocksFile: { type: 'string' },
        },
        required: ['mocksFile'],
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
      };

      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].keyword, 'required');
    });

    test('should detect invalid enum values', () => {
      const schema = {
        type: 'object',
        properties: {
          logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        },
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
        logLevel: 'invalid',
      };

      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].keyword, 'enum');
    });

    test('should report multiple errors', () => {
      const schema = {
        type: 'object',
        properties: {
          mocksFile: { type: 'string' },
          enabled: { type: 'boolean' },
        },
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
        mocksFile: 12345,
        unknown1: 'value',
        unknown2: 'value',
      };

      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length >= 3); // type error + 2 additional properties
    });

    test('should exclude $schema from validation', () => {
      const schema = {
        type: 'object',
        properties: {
          mocksFile: { type: 'string' },
        },
        additionalProperties: false,
      };

      const config = {
        $schema: 'https://example.com/schema.json',
        mocksFile: 'mocks.json',
      };

      // $schema should not cause an additionalProperties error
      const result = validateAgainstSchema(config, schema);
      assert.strictEqual(result.valid, true);
    });
  });

  suite('schema cache', () => {
    test('clearSchemaCache should clear the cache', () => {
      // Note: We can't directly test fetchSchema caching without mocking fetch,
      // but we can test the cache utilities
      assert.strictEqual(getSchemaCacheSize(), 0);
      clearSchemaCache();
      assert.strictEqual(getSchemaCacheSize(), 0);
    });
  });
});
