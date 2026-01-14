/**
 * Version detection tests.
 * Verifies extractVersionFromOutput parses Dev Proxy output correctly.
 */
import * as assert from 'assert';
import * as detect from '../detect';

suite('extractVersionFromOutput', () => {
  test('should extract stable version from Dev Proxy output', () => {
    const output = `  info    1 error responses loaded from /opt/homebrew/Cellar/dev-proxy/0.29.0/devproxy-errors.json
  info    v0.29.0`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '0.29.0');
  });

  test('should extract beta version from Dev Proxy output', () => {
    const output = `  info    1 error responses loaded from /opt/homebrew/Cellar/dev-proxy/0.30.0-beta.1/devproxy-errors.json
  info    v0.30.0-beta.1`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '0.30.0-beta.1');
  });

  test('should extract version without v prefix', () => {
    const output = `  info    Some message
  info    1.2.3`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '1.2.3');
  });

  test('should extract pre-release version with alpha identifier', () => {
    const output = `  info    Dev Proxy version
  info    v2.1.0-alpha.5`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '2.1.0-alpha.5');
  });

  test('should extract pre-release version with rc identifier', () => {
    const output = `  info    Dev Proxy version
  info    v1.5.0-rc.2`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '1.5.0-rc.2');
  });

  test('should return empty string for output without version', () => {
    const output = `  info    Some random output
  info    No version here`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '');
  });

  test('should return empty string for empty output', () => {
    const result = detect.extractVersionFromOutput('');
    assert.strictEqual(result, '');
  });

  test('should return empty string for null/undefined output', () => {
    const result1 = detect.extractVersionFromOutput(null as any);
    const result2 = detect.extractVersionFromOutput(undefined as any);
    assert.strictEqual(result1, '');
    assert.strictEqual(result2, '');
  });

  test('should extract first version when multiple versions present', () => {
    const output = `  info    v1.0.0
  info    v2.0.0`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '1.0.0');
  });

  test('should handle version with build metadata', () => {
    const output = `  info    Build info
  info    v1.0.0-beta.1+build.123`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '1.0.0-beta.1');
  });

  test('should not extract version from file paths in error responses (issue #286)', () => {
    const output = `info    1 error responses loaded from /opt/homebrew/Cellar/dev-proxy/v0.29.1/devproxy-errors.json`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '');
  });

  test('should extract version from update notification line, ignoring file paths (issue #286)', () => {
    const output = `info    1 error responses loaded from /opt/homebrew/Cellar/dev-proxy/v0.29.0/devproxy-errors.json
info    v0.29.1`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '0.29.1');
  });

  test('should not extract version from Windows file paths', () => {
    const output = `info    1 error responses loaded from C:\\Program Files\\dev-proxy\\v0.29.1\\devproxy-errors.json`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '');
  });

  test('should extract version from actual update notification with Windows paths in earlier lines', () => {
    const output = `info    1 error responses loaded from C:\\Program Files\\dev-proxy\\v0.29.0\\devproxy-errors.json
info    v0.29.1`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '0.29.1');
  });

  test('should not extract beta version from Unix file paths (issue #286)', () => {
    const output = `info    1 error responses loaded from /opt/homebrew/Cellar/dev-proxy/v0.30.0-beta.2/devproxy-errors.json`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '');
  });

  test('should not extract beta version from Windows file paths (issue #286)', () => {
    const output = `info    1 error responses loaded from C:\\Program Files\\dev-proxy\\v0.30.0-beta.2\\devproxy-errors.json`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '');
  });

  test('should extract beta version from update notification, ignoring file paths (issue #286)', () => {
    const output = `info    1 error responses loaded from /opt/homebrew/Cellar/dev-proxy/v0.30.0-beta.1/devproxy-errors.json
info    v0.30.0-beta.2`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '0.30.0-beta.2');
  });

  test('should extract beta version from update notification with Windows paths in earlier lines (issue #286)', () => {
    const output = `info    1 error responses loaded from C:\\Program Files\\dev-proxy\\v0.30.0-beta.1\\devproxy-errors.json
info    v0.30.0-beta.2`;

    const result = detect.extractVersionFromOutput(output);
    assert.strictEqual(result, '0.30.0-beta.2');
  });
});
