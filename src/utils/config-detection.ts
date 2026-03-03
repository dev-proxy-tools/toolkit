import * as vscode from 'vscode';
import parse from 'json-to-ast';
import * as logger from '../logger';

/**
 * Find a property node by its key type and value.
 * Local copy to avoid circular dependency.
 */
function getASTNode(
  children: parse.PropertyNode[],
  type: string,
  keyValue: string
): parse.PropertyNode | undefined {
  return children.find(child => child.key.type === type && child.key.value === keyValue);
}

/**
 * Utilities for detecting and validating Dev Proxy configuration files.
 */

/**
 * Check if a document is a Dev Proxy configuration file.
 *
 * A file is considered a config file if:
 * 1. The file name is devproxyrc.json
 * 2. It has a $schema property containing "dev-proxy" and ending with "rc.schema.json"
 * 3. It contains a plugins array (schema is optional)
 *
 * Note: If a file has a $schema that doesn't match Dev Proxy but has a plugins array,
 * it's NOT considered a config file (could be some other tool's config).
 */
export function isConfigFile(document: vscode.TextDocument): boolean {
  const fileName = document.fileName.toLowerCase();

  // Must be a JSON file
  if (!(fileName.endsWith('.json') || fileName.endsWith('.jsonc'))) {
    return false;
  }

  try {
    const documentNode = parse(document.getText()) as parse.ObjectNode;

    // Check 1: Named devproxyrc.json
    if (document.fileName.endsWith('devproxyrc.json')) {
      return true;
    }

    // Check 2: Has a Dev Proxy schema
    const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');
    if (schemaNode) {
      const schema = (schemaNode.value as parse.LiteralNode).value as string;
      if (schema.includes('dev-proxy') && schema.endsWith('rc.schema.json')) {
        return true;
      }
      // Has a schema but it's not Dev Proxy - NOT a config file even if it has plugins
      return false;
    }

    // Check 3: No schema, but has plugins array
    const pluginsNode = getASTNode(documentNode.children, 'Identifier', 'plugins');
    if (pluginsNode && pluginsNode.value.type === 'Array') {
      return true;
    }

    return false;
  } catch (error) {
    logger.debug('Failed to parse document for config file detection', { file: document.fileName, error });
    return false;
  }
}

/**
 * Check if a document is any Dev Proxy file (not just config).
 *
 * This includes mocks, responses, and other files with a Dev Proxy schema.
 */
export function isProxyFile(document: vscode.TextDocument): boolean {
  try {
    const documentNode = parse(document.getText()) as parse.ObjectNode;
    const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');

    if (schemaNode) {
      const schema = (schemaNode.value as parse.LiteralNode).value as string;
      return schema.includes('dev-proxy') && schema.endsWith('.schema.json');
    }

    return false;
  } catch (error) {
    logger.debug('Failed to parse document for proxy file detection', { file: document.fileName, error });
    return false;
  }
}

/**
 * Extract version from a Dev Proxy schema URL.
 *
 * Schema URLs follow the pattern:
 *   https://raw.githubusercontent.com/.../schemas/v{version}/{filename}
 *
 * @returns The version string (e.g., "0.24.0") or empty string if not found.
 */
export function extractVersionFromSchemaUrl(schemaUrl: string): string {
  // Matches /vX.Y.Z/ or /vX.Y.Z-prerelease/ in schema URLs
  const versionPattern = /\/v(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)\//;
  const match = schemaUrl.match(versionPattern);
  return match ? match[1] : '';
}

/**
 * Find all Dev Proxy config files in the workspace that have an outdated schema version.
 *
 * Scans the workspace for JSON files containing a Dev Proxy `$schema` property
 * and compares the schema version against the installed Dev Proxy version.
 *
 * @param devProxyVersion The installed Dev Proxy version (e.g., "0.24.0")
 * @returns Array of URIs for config files with mismatched schema versions.
 */
export async function findOutdatedConfigFiles(devProxyVersion: string): Promise<vscode.Uri[]> {
  const outdatedFiles: vscode.Uri[] = [];

  const jsonFiles = await vscode.workspace.findFiles('**/*.{json,jsonc}', '**/node_modules/**');

  for (const uri of jsonFiles) {
    try {
      const contentBytes = await vscode.workspace.fs.readFile(uri);
      const content = Buffer.from(contentBytes).toString('utf-8');

      // Quick check before parsing
      if (!content.includes('dev-proxy') || !content.includes('schema')) {
        continue;
      }

      const rootNode = parse(content);

      if (rootNode.type !== 'Object') {
        continue;
      }

      const documentNode = rootNode as parse.ObjectNode;
      const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');

      if (!schemaNode) {
        continue;
      }

      const schemaValue = (schemaNode.value as parse.LiteralNode).value as string;

      if (!schemaValue.includes('dev-proxy') || !schemaValue.endsWith('.schema.json')) {
        continue;
      }

      const schemaVersion = extractVersionFromSchemaUrl(schemaValue);

      if (schemaVersion && schemaVersion !== devProxyVersion) {
        outdatedFiles.push(uri);
      }
    } catch {
      // Skip files that can't be read or parsed
    }
  }

  return outdatedFiles;
}
