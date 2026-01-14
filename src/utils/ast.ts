import * as vscode from 'vscode';
import parse from 'json-to-ast';

/**
 * Utilities for working with json-to-ast nodes.
 */

/**
 * Find a property node by its key type and value.
 */
export function getASTNode(
  children: parse.PropertyNode[],
  type: string,
  keyValue: string
): parse.PropertyNode | undefined {
  return children.find(child => child.key.type === type && child.key.value === keyValue);
}

/**
 * Convert an AST node's location to a VS Code Range.
 *
 * Handles the conversion from 1-based line numbers (AST) to 0-based (VS Code),
 * and properly excludes quotes from string literal ranges.
 */
export function getRangeFromASTNode(
  node: parse.PropertyNode | parse.LiteralNode | parse.ObjectNode | parse.ValueNode
): vscode.Range {
  const startLine = node?.loc?.start.line ?? 0;
  const endLine = node?.loc?.end.line ?? 0;
  let startColumn = node?.loc?.start.column ?? 0;
  let endColumn = node?.loc?.end.column ?? 0;

  // For string literals, exclude the surrounding quotes from the range
  if (node.type === 'Literal' && typeof (node as parse.LiteralNode).value === 'string') {
    // Start column points to quote, end column points after closing quote
    // We keep start as-is (0-based equivalent) and adjust end to exclude closing quote
    endColumn = endColumn - 2;
  } else {
    // For non-string literals, just convert from 1-based to 0-based
    startColumn = startColumn - 1;
    endColumn = endColumn - 1;
  }

  return new vscode.Range(
    new vscode.Position(startLine - 1, startColumn),
    new vscode.Position(endLine - 1, endColumn)
  );
}

/**
 * Get the start position of an AST node.
 */
export function getStartPositionFromASTNode(
  node: parse.PropertyNode | parse.LiteralNode | parse.ObjectNode | parse.ValueNode
): vscode.Position {
  const startLine = node?.loc?.start.line ?? 0;
  const startColumn = node?.loc?.start.column ?? 0;

  return new vscode.Position(startLine - 1, startColumn);
}
