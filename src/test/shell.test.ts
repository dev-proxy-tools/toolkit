/**
 * Shell utility tests.
 * Tests for pure utility functions in shell.ts.
 */
import * as assert from 'assert';
import { getPackageIdentifier } from '../utils/shell';
import { PackageManager, VersionPreference, HomebrewPackageIdentifier, WingetPackageIdentifier } from '../enums';

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
    const result = getPackageIdentifier(VersionPreference.Stable, 'unknown' as unknown as PackageManager);
    assert.strictEqual(result, undefined);
  });
});
