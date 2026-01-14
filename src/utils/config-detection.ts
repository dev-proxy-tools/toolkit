import * as vscode from 'vscode';
import parse from 'json-to-ast';

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
  } catch {
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
  } catch {
    return false;
  }
}
