import {defineConfig} from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  version: 'insiders',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
  },
  // Note: Coverage exclude patterns don't work with source-mapped files.
  // This is a known issue in @vscode/test-cli - the exclude is applied
  // before source map remapping, so patterns like '**/test/**' won't match.
  // See: https://github.com/microsoft/vscode-test-cli/issues
  // Impact: src/test/helpers.ts (42 statements) is included in coverage.
  // Since it's 100% covered, this inflates coverage by ~2.8%.
});
