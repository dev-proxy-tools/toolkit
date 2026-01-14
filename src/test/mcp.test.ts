/**
 * MCP Server tests.
 * Tests for Model Context Protocol server registration.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { registerMcpServer } from '../mcp';
import { getExtensionContext } from './helpers';

suite('MCP Server', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;

  setup(async () => {
    sandbox = sinon.createSandbox();
    mockContext = await getExtensionContext();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should register MCP server definition provider', () => {
    const registerStub = sandbox.stub(vscode.lm, 'registerMcpServerDefinitionProvider').returns({
      dispose: () => {},
    } as vscode.Disposable);

    registerMcpServer(mockContext);

    assert.ok(registerStub.calledOnce, 'Should register MCP server provider');
    assert.strictEqual(
      registerStub.firstCall.args[0],
      'devproxymcp',
      'Should use correct server ID'
    );
  });

  test('should provide MCP server definitions', async () => {
    let capturedProvider: vscode.McpServerDefinitionProvider | undefined;

    sandbox.stub(vscode.lm, 'registerMcpServerDefinitionProvider').callsFake((id, provider) => {
      capturedProvider = provider;
      return { dispose: () => {} } as vscode.Disposable;
    });

    registerMcpServer(mockContext);

    assert.ok(capturedProvider, 'Provider should be captured');

    const definitions = await capturedProvider!.provideMcpServerDefinitions(
      {} as vscode.CancellationToken
    );

    assert.ok(Array.isArray(definitions), 'Should return an array');
    assert.strictEqual(definitions.length, 1, 'Should return one server definition');

    const server = definitions[0] as vscode.McpStdioServerDefinition;
    assert.strictEqual(server.label, 'Dev Proxy', 'Should have correct label');
    assert.strictEqual(server.command, 'npx', 'Should use npx command');
    assert.deepStrictEqual(server.args, ['-y', '@devproxy/mcp'], 'Should have correct args');
  });

  test('should add subscription to context', () => {
    sandbox.stub(vscode.lm, 'registerMcpServerDefinitionProvider').returns({
      dispose: () => {},
    } as vscode.Disposable);

    const initialLength = mockContext.subscriptions.length;
    registerMcpServer(mockContext);

    assert.strictEqual(
      mockContext.subscriptions.length,
      initialLength + 1,
      'Should add one subscription'
    );
  });
});
