/**
 * Notification tests.
 * Verifies install and upgrade notifications.
 */
import * as assert from 'assert';
import { handleStartNotification } from '../notifications';
import { testDevProxyInstall, getExtensionContext, createDevProxyInstall } from './helpers';

suite('notifications', () => {
  suiteSetup(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  teardown(async () => {
    const context = await getExtensionContext();
    await context.globalState.update('devProxyInstall', testDevProxyInstall);
  });

  test('should show install notification when devproxy is not installed on mac', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isInstalled: false, platform: 'darwin', version: '' })
    );

    const notification = handleStartNotification(context);

    const expected = 'Dev Proxy is not installed, or not in PATH.';
    const actual = notification !== undefined && notification().message;
    assert.strictEqual(actual, expected);
  });

  test('should show install notification when devproxy is not installed on windows', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isInstalled: false, platform: 'win32', version: '' })
    );

    const notification = handleStartNotification(context);

    const expected = 'Dev Proxy is not installed, or not in PATH.';
    const actual = notification !== undefined && notification().message;
    assert.strictEqual(actual, expected);
  });

  test('should not show install notification when devproxy is installed on mac', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isInstalled: true, isOutdated: false, platform: 'darwin' })
    );

    const notification = handleStartNotification(context);

    const expected = true;
    const actual = notification === undefined;
    assert.strictEqual(actual, expected);
  });

  test('should not show install notification when devproxy is installed on windows', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isInstalled: true, isOutdated: false, platform: 'win32' })
    );

    const notification = handleStartNotification(context);

    const expected = true;
    const actual = notification === undefined;
    assert.strictEqual(actual, expected);
  });

  test('should not show install notification when running in unsupported operating system', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isInstalled: true, isOutdated: false, platform: 'linux' })
    );

    const notification = handleStartNotification(context);

    const expected = true;
    const actual = notification === undefined;
    assert.strictEqual(actual, expected);
  });

  test('should show upgrade notification when devproxy is not latest version', async () => {
    const context = await getExtensionContext();
    await context.globalState.update(
      'devProxyInstall',
      createDevProxyInstall({ isOutdated: true, version: '0.1.0' })
    );

    const notification = handleStartNotification(context);

    const expected = 'New Dev Proxy version 0.14.1 is available.';
    const actual = notification !== undefined && notification().message;
    assert.strictEqual(actual, expected);
  });
});
