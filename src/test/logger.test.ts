/**
 * Logger module tests.
 * Verifies the logger initializes and provides leveled logging functions.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { initializeLogger, debug, info, warn, error, trace } from '../logger';

suite('Logger', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('initializeLogger should create a LogOutputChannel', () => {
    const channel = initializeLogger();
    assert.ok(channel);
    assert.strictEqual(channel.name, 'Dev Proxy Toolkit');
    channel.dispose();
  });

  test('logging functions should not throw before initialization', () => {
    // These should be safe to call even if a different logger instance is active
    assert.doesNotThrow(() => trace('test'));
    assert.doesNotThrow(() => debug('test'));
    assert.doesNotThrow(() => info('test'));
    assert.doesNotThrow(() => warn('test'));
    assert.doesNotThrow(() => error('test'));
  });

  test('logging functions should not throw after initialization', () => {
    const channel = initializeLogger();
    assert.doesNotThrow(() => trace('test trace'));
    assert.doesNotThrow(() => debug('test debug'));
    assert.doesNotThrow(() => info('test info'));
    assert.doesNotThrow(() => warn('test warn'));
    assert.doesNotThrow(() => error('test error'));
    channel.dispose();
  });
});
