import * as vscode from 'vscode';
import {DevProxyInstall} from './types';
import parse from 'json-to-ast';
import { getASTNode, getRangeFromASTNode } from './utils';

export const registerCodeActions = (context: vscode.ExtensionContext) => {
  const devProxyInstall =
    context.globalState.get<DevProxyInstall>('devProxyInstall');

  if (!devProxyInstall) {
    return;
  }

  const devProxyVersion = devProxyInstall.isBeta
    ? devProxyInstall.version.split('-')[0]
    : devProxyInstall.version;

  registerInvalidSchemaFixes(devProxyVersion, context);
  registerDeprecatedPluginPathFixes(context);
  registerLanguageModelFixes(context);
};

function registerInvalidSchemaFixes(
  devProxyVersion: string,
  context: vscode.ExtensionContext,
) {
  const invalidSchema: vscode.CodeActionProvider = {
    provideCodeActions: (document, range, context, token) => {
      const diagnostic = context.diagnostics.find(diagnostic => {
        return diagnostic.code === 'invalidSchema';
      });
      if (diagnostic) {
        const fix = new vscode.CodeAction(
          'Update schema',
          vscode.CodeActionKind.QuickFix,
        );
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(
          document.uri,
          new vscode.Range(diagnostic.range.start, diagnostic.range.end),
          `https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas/v${devProxyVersion}/rc.schema.json`,
        );
        return [fix];
      }
    },
  };

  // Code action for invalid schema
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('json', invalidSchema),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('jsonc', invalidSchema),
  );
}

function registerDeprecatedPluginPathFixes(context: vscode.ExtensionContext) {
  const deprecatedPluginPaths: vscode.CodeActionProvider = {
    provideCodeActions: (document, range, context, token) => {
      const correctPluginPath = '~appFolder/plugins/DevProxy.Plugins.dll';

      // Check if the current range intersects with a deprecated plugin path diagnostic
      const currentDiagnostic = context.diagnostics.find(diagnostic => {
        return (
          diagnostic.code === 'deprecatedPluginPath' &&
          diagnostic.range.intersection(range)
        );
      });

      // Only provide deprecated plugin path actions if user is on a deprecated plugin path diagnostic
      if (!currentDiagnostic) {
        return [];
      }

      const fixes: vscode.CodeAction[] = [];

      // Individual fix for the current diagnostic
      const individualFix = new vscode.CodeAction(
        'Update plugin path',
        vscode.CodeActionKind.QuickFix,
      );
      individualFix.edit = new vscode.WorkspaceEdit();
      individualFix.edit.replace(
        document.uri,
        new vscode.Range(
          currentDiagnostic.range.start,
          currentDiagnostic.range.end,
        ),
        correctPluginPath,
      );
      fixes.push(individualFix);

      // Bulk fix for all deprecated plugin paths in the document (only show when on a deprecated plugin path)
      const allDeprecatedPluginPathDiagnostics = vscode.languages
        .getDiagnostics(document.uri)
        .filter(diagnostic => {
          return diagnostic.code === 'deprecatedPluginPath';
        });

      if (allDeprecatedPluginPathDiagnostics.length > 1) {
        const bulkFix = new vscode.CodeAction(
          `Update all plugin paths`,
          vscode.CodeActionKind.QuickFix,
        );
        bulkFix.edit = new vscode.WorkspaceEdit();

        // Update all deprecated plugin paths
        allDeprecatedPluginPathDiagnostics.forEach(diagnostic => {
          bulkFix.edit!.replace(
            document.uri,
            new vscode.Range(diagnostic.range.start, diagnostic.range.end),
            correctPluginPath,
          );
        });

        bulkFix.isPreferred = true;
        fixes.push(bulkFix);
      }

      return fixes;
    },
  };
  // Code action for deprecated plugin paths (individual and bulk updates)
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('json', deprecatedPluginPaths),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      'jsonc',
      deprecatedPluginPaths,
    ),
  );
}

function registerLanguageModelFixes(context: vscode.ExtensionContext) {
  const languageModelMissing: vscode.CodeActionProvider = {
    provideCodeActions: (document, range, context, token) => {
      // Check if the current range intersects with a missing language model diagnostic
      const currentDiagnostic = context.diagnostics.find(diagnostic => {
        return (
          diagnostic.code === 'missingLanguageModel' &&
          diagnostic.range.intersection(range)
        );
      });

      // Only provide language model actions if user is on a missing language model diagnostic
      if (!currentDiagnostic) {
        return [];
      }

      const fixes: vscode.CodeAction[] = [];

      // Fix to add languageModel configuration
      const addLanguageModelFix = new vscode.CodeAction(
        'Add languageModel configuration',
        vscode.CodeActionKind.QuickFix,
      );
      
      addLanguageModelFix.edit = new vscode.WorkspaceEdit();
      
      try {
        // Parse the document using json-to-ast for accurate insertion
        const documentNode = parse(document.getText()) as parse.ObjectNode;
        
        // Check if languageModel already exists
        const existingLanguageModel = getASTNode(
          documentNode.children,
          'Identifier',
          'languageModel'
        );
        
        if (existingLanguageModel) {
          // languageModel exists but enabled might be false or missing
          const languageModelObjectNode = existingLanguageModel.value as parse.ObjectNode;
          const enabledNode = getASTNode(
            languageModelObjectNode.children,
            'Identifier',
            'enabled'
          );
          
          if (enabledNode) {
            // Replace the enabled value
            addLanguageModelFix.edit.replace(
              document.uri,
              getRangeFromASTNode(enabledNode.value),
              'true'
            );
          } else {
            // Add enabled property
            const insertPosition = new vscode.Position(
              languageModelObjectNode.loc!.end.line - 1,
              languageModelObjectNode.loc!.end.column - 1
            );
            addLanguageModelFix.edit.insert(
              document.uri,
              insertPosition,
              '\n    "enabled": true'
            );
          }
        } else {
          // Add new languageModel object
          // Find the last property to insert after it
          const lastProperty = documentNode.children[documentNode.children.length - 1] as parse.PropertyNode;
          const insertPosition = new vscode.Position(
            lastProperty.loc!.end.line - 1,
            lastProperty.loc!.end.column
          );
          
          addLanguageModelFix.edit.insert(
            document.uri,
            insertPosition,
            ',\n  "languageModel": {\n    "enabled": true\n  }'
          );
        }
      } catch (error) {
        // Fallback to simple text-based insertion
        const documentText = document.getText();
        const lines = documentText.split('\n');
        
        // Find where to insert the languageModel config
        let insertLine = lines.length - 1;
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].includes('}')) {
            insertLine = i;
            break;
          }
        }
        
        const hasContentBefore = lines.slice(0, insertLine).some(line => 
          line.trim() && !line.trim().startsWith('{') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')
        );
        
        const languageModelConfig = hasContentBefore ? 
          ',\n  "languageModel": {\n    "enabled": true\n  }' :
          '  "languageModel": {\n    "enabled": true\n  }';
        
        const insertPosition = new vscode.Position(insertLine, 0);
        addLanguageModelFix.edit.insert(document.uri, insertPosition, languageModelConfig + '\n');
      }
      
      addLanguageModelFix.isPreferred = true;
      fixes.push(addLanguageModelFix);

      return fixes;
    },
  };

  // Code action for missing language model configuration
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('json', languageModelMissing),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('jsonc', languageModelMissing),
  );
}
