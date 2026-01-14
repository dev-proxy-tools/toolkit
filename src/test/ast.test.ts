/**
 * AST utility tests.
 * Tests for json-to-ast helper functions.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import parse from 'json-to-ast';
import { getASTNode, getRangeFromASTNode, getStartPositionFromASTNode } from '../utils/ast';

suite('getASTNode', () => {
  const testJson = `{
    "$schema": "https://example.com/schema.json",
    "name": "test",
    "enabled": true
  }`;

  let ast: parse.ObjectNode;
  let children: parse.PropertyNode[];

  suiteSetup(() => {
    ast = parse(testJson) as parse.ObjectNode;
    children = ast.children;
  });

  test('should find property by key type and value', () => {
    const node = getASTNode(children, 'Identifier', '$schema');
    assert.ok(node, 'Should find $schema property');
    assert.strictEqual(node.key.value, '$schema');
  });

  test('should find different properties', () => {
    const nameNode = getASTNode(children, 'Identifier', 'name');
    assert.ok(nameNode, 'Should find name property');
    assert.strictEqual(nameNode.key.value, 'name');

    const enabledNode = getASTNode(children, 'Identifier', 'enabled');
    assert.ok(enabledNode, 'Should find enabled property');
    assert.strictEqual(enabledNode.key.value, 'enabled');
  });

  test('should return undefined for non-existent property', () => {
    const node = getASTNode(children, 'Identifier', 'nonexistent');
    assert.strictEqual(node, undefined);
  });

  test('should return undefined for wrong type', () => {
    const node = getASTNode(children, 'Literal', '$schema');
    assert.strictEqual(node, undefined);
  });
});

suite('getRangeFromASTNode', () => {
  test('should convert AST location to VS Code Range for string literal', () => {
    const json = `{"name": "test"}`;
    const ast = parse(json) as parse.ObjectNode;
    const nameNode = ast.children[0];
    const valueNode = nameNode.value as parse.LiteralNode;

    const range = getRangeFromASTNode(valueNode);

    assert.ok(range instanceof vscode.Range, 'Should return a Range');
    // String literals should exclude quotes
    assert.strictEqual(range.start.line, 0, 'Start line should be 0 (0-based)');
    assert.strictEqual(range.end.line, 0, 'End line should be 0');
  });

  test('should handle property nodes', () => {
    const json = `{"name": "test"}`;
    const ast = parse(json) as parse.ObjectNode;
    const nameNode = ast.children[0];

    const range = getRangeFromASTNode(nameNode);

    assert.ok(range instanceof vscode.Range, 'Should return a Range');
    assert.strictEqual(range.start.line, 0);
  });

  test('should handle object nodes', () => {
    const json = `{"nested": {"inner": "value"}}`;
    const ast = parse(json) as parse.ObjectNode;
    const nestedNode = ast.children[0];
    const innerObject = nestedNode.value as parse.ObjectNode;

    const range = getRangeFromASTNode(innerObject);

    assert.ok(range instanceof vscode.Range, 'Should return a Range');
  });

  test('should handle multi-line JSON', () => {
    const json = `{
  "name": "test",
  "value": 123
}`;
    const ast = parse(json) as parse.ObjectNode;
    const valueNode = ast.children[1]; // "value": 123

    const range = getRangeFromASTNode(valueNode);

    assert.ok(range instanceof vscode.Range, 'Should return a Range');
    assert.strictEqual(range.start.line, 2, 'Should be on line 3 (0-based = 2)');
  });

  test('should handle numeric literals differently from strings', () => {
    const json = `{"count": 42}`;
    const ast = parse(json) as parse.ObjectNode;
    const countNode = ast.children[0];
    const valueNode = countNode.value as parse.LiteralNode;

    const range = getRangeFromASTNode(valueNode);

    assert.ok(range instanceof vscode.Range, 'Should return a Range');
    // Numeric literals don't have quotes to exclude
  });

  test('should handle boolean literals', () => {
    const json = `{"enabled": true}`;
    const ast = parse(json) as parse.ObjectNode;
    const enabledNode = ast.children[0];
    const valueNode = enabledNode.value as parse.LiteralNode;

    const range = getRangeFromASTNode(valueNode);

    assert.ok(range instanceof vscode.Range, 'Should return a Range');
  });
});

suite('getStartPositionFromASTNode', () => {
  test('should return start position of node', () => {
    const json = `{"name": "test"}`;
    const ast = parse(json) as parse.ObjectNode;
    const nameNode = ast.children[0];

    const position = getStartPositionFromASTNode(nameNode);

    assert.ok(position instanceof vscode.Position, 'Should return a Position');
    assert.strictEqual(position.line, 0, 'Line should be 0 (0-based)');
  });

  test('should handle multi-line positions', () => {
    const json = `{
  "first": 1,
  "second": 2
}`;
    const ast = parse(json) as parse.ObjectNode;
    const secondNode = ast.children[1];

    const position = getStartPositionFromASTNode(secondNode);

    assert.ok(position instanceof vscode.Position, 'Should return a Position');
    assert.strictEqual(position.line, 2, 'Should be on line 3 (0-based = 2)');
  });

  test('should return position for object nodes', () => {
    const json = `{"nested": {"inner": "value"}}`;
    const ast = parse(json) as parse.ObjectNode;
    const nestedNode = ast.children[0];
    const innerObject = nestedNode.value as parse.ObjectNode;

    const position = getStartPositionFromASTNode(innerObject);

    assert.ok(position instanceof vscode.Position, 'Should return a Position');
    assert.strictEqual(position.line, 0);
  });
});
