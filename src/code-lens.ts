import * as vscode from 'vscode';
import { isConfigFile, getASTNode, getRangeFromASTNode } from './utils';
import parse from 'json-to-ast';
import { pluginSnippets } from './data';

export const registerCodeLens = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'json' },
      pluginLensProvider
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      {scheme: 'file', language: 'jsonc'},
      pluginLensProvider,
    ),
  );
};

export const pluginLensProvider: vscode.CodeLensProvider = {
  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    return createCodeLensForPluginNodes(document);
  },
};

export const createCodeLensForPluginNodes = (document: vscode.TextDocument) => {
  const codeLens: vscode.CodeLens[] = [];
  if (isConfigFile(document)) {
    const documentNode = parse(document.getText()) as parse.ObjectNode;
    const pluginsNode = getASTNode(
      documentNode.children,
      'Identifier',
      'plugins'
    );

    if (
      pluginsNode &&
      (pluginsNode.value as parse.ArrayNode).children.length !== 0
    ) {
      const pluginNodes = (pluginsNode.value as parse.ArrayNode)
        .children as parse.ObjectNode[];

      pluginNodes.forEach((pluginNode: parse.ObjectNode) => {
        const pluginNameNode = getASTNode(
          pluginNode.children,
          'Identifier',
          'name'
        );
        if (!pluginNameNode) {
          return;
        }
        const pluginName = (pluginNameNode?.value as parse.LiteralNode)
          .value as string;

        const isValidName = pluginSnippets[pluginName];

        if (isValidName) {
          codeLens.push(
            new vscode.CodeLens(getRangeFromASTNode(pluginNameNode), {
              title: `📄 ${pluginName}`,
              command: 'dev-proxy-toolkit.openPluginDoc',
              arguments: [pluginName],
            })
          );
        }
      });
    }
  }

  return codeLens;
};
