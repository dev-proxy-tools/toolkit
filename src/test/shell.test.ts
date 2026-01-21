/**
 * Shell utility tests.
 * Tests for pure utility functions in shell.ts.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as fs from 'fs';
import { getPackageIdentifier, resolveDevProxyExecutable } from '../utils/shell';
import {
  PackageManager,
  VersionPreference,
  HomebrewPackageIdentifier,
  WingetPackageIdentifier,
} from '../enums';

suite('getPackageIdentifier', () => {
  test('should return stable Homebrew package for stable preference', () => {
    const result = getPackageIdentifier(VersionPreference.Stable, PackageManager.Homebrew);
    assert.strictEqual(result, HomebrewPackageIdentifier.Stable);
  });

  test('should return beta Homebrew package for beta preference', () => {
    const result = getPackageIdentifier(VersionPreference.Beta, PackageManager.Homebrew);
    assert.strictEqual(result, HomebrewPackageIdentifier.Beta);
  });

  test('should return stable Winget package for stable preference', () => {
    const result = getPackageIdentifier(VersionPreference.Stable, PackageManager.Winget);
    assert.strictEqual(result, WingetPackageIdentifier.Stable);
  });

  test('should return beta Winget package for beta preference', () => {
    const result = getPackageIdentifier(VersionPreference.Beta, PackageManager.Winget);
    assert.strictEqual(result, WingetPackageIdentifier.Beta);
  });

  test('should return undefined for unknown package manager', () => {
    const result = getPackageIdentifier(
      VersionPreference.Stable,
      'unknown' as unknown as PackageManager
    );
    assert.strictEqual(result, undefined);
  });
});

suite('resolveDevProxyExecutable', () => {
  let existsSyncStub: sinon.SinonStub;

  setup(() => {
    existsSyncStub = sinon.stub(fs, 'existsSync');
  });

  teardown(() => {
    sinon.restore();
  });

  test('should return custom path when provided and non-empty', async () => {
    const customPath = '/custom/path/to/devproxy';
    const result = await resolveDevProxyExecutable('devproxy', customPath);
    assert.strictEqual(result, customPath);
  });

  test('should trim whitespace from custom path', async () => {
    const customPath = '  /custom/path/to/devproxy  ';
    const result = await resolveDevProxyExecutable('devproxy', customPath);
    assert.strictEqual(result, '/custom/path/to/devproxy');
  });

  test('should ignore empty custom path and proceed with auto-detection', async () => {
    // With empty custom path and no auto-detection success, should return bare command
    existsSyncStub.returns(false);
    const result = await resolveDevProxyExecutable('devproxy', '');
    // Will fall through to bare command since nothing else succeeds
    assert.strictEqual(result, 'devproxy');
  });

  test('should ignore whitespace-only custom path', async () => {
    existsSyncStub.returns(false);
    const result = await resolveDevProxyExecutable('devproxy', '   ');
    assert.strictEqual(result, 'devproxy');
  });

  test('should handle undefined custom path', async () => {
    existsSyncStub.returns(false);
    const result = await resolveDevProxyExecutable('devproxy', undefined);
    assert.strictEqual(result, 'devproxy');
  });
});
