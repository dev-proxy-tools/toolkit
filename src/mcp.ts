import * as vscode from 'vscode';
import * as logger from './logger';

export const registerMcpServer = (context: vscode.ExtensionContext) => {
  logger.debug('Registering MCP server definition provider');
  const didChangeEmitter = new vscode.EventEmitter<void>();

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider('devproxymcp', {
      onDidChangeMcpServerDefinitions: didChangeEmitter.event,
      provideMcpServerDefinitions: async () => {
        const server: vscode.McpStdioServerDefinition = {
          label: 'Dev Proxy',
          command: 'npx',
          args: ['-y', '@devproxy/mcp'],
          env: {},
        };

        return [server];
      },
    }),
  );
};
