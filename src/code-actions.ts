import * as vscode from 'vscode';
import {DevProxyInstall} from './types';
import parse from 'json-to-ast';
import { getASTNode, getRangeFromASTNode } from './utils';

/**
 * Extract the diagnostic code value from the object format.
 * All diagnostic codes use { value, target } objects for clickable links.
 */
function getDiagnosticCodeValue(diagnostic: vscode.Diagnostic): string | undefined {
  if (typeof diagnostic.code === 'object' && diagnostic.code !== null) {
    return (diagnostic.code as { value: string }).value;
  }
  return undefined;
}

/**
 * Find a diagnostic by code, optionally requiring intersection with a range.
 */
function findDiagnosticByCode(
  diagnostics: readonly vscode.Diagnostic[],
  code: string,
  range?: vscode.Range
): vscode.Diagnostic | undefined {
  return diagnostics.find(diagnostic => {
    const diagnosticCode = getDiagnosticCodeValue(diagnostic);
    if (diagnosticCode !== code) {
      return false;
    }
    return range ? diagnostic.range.intersection(range) : true;
  });
}

/**
 * Get all diagnostics with a specific code from a document.
 */
function getDiagnosticsByCode(documentUri: vscode.Uri, code: string): vscode.Diagnostic[] {
  return vscode.languages.getDiagnostics(documentUri).filter(diagnostic => {
    return getDiagnosticCodeValue(diagnostic) === code;
  });
}

/**
 * Register a code action provider for both JSON and JSONC files.
 */
function registerJsonCodeActionProvider(
  context: vscode.ExtensionContext,
  provider: vscode.CodeActionProvider
): void {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('json', provider),
    vscode.languages.registerCodeActionsProvider('jsonc', provider),
  );
}

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
    provideCodeActions: (document, range, context) => {
      const diagnostic = findDiagnosticByCode(context.diagnostics, 'invalidSchema');
      if (!diagnostic) {
        return;
      }

      const fix = new vscode.CodeAction(
        'Update schema',
        vscode.CodeActionKind.QuickFix,
      );
      fix.edit = new vscode.WorkspaceEdit();
      fix.edit.replace(
        document.uri,
        diagnostic.range,
        `https://raw.githubusercontent.com/dotnet/dev-proxy/main/schemas/v${devProxyVersion}/rc.schema.json`,
      );
      fix.isPreferred = true;
      return [fix];
    },
  };

  registerJsonCodeActionProvider(context, invalidSchema);
}

function registerDeprecatedPluginPathFixes(context: vscode.ExtensionContext) {
  const correctPluginPath = '~appFolder/plugins/DevProxy.Plugins.dll';

  const deprecatedPluginPaths: vscode.CodeActionProvider = {
    provideCodeActions: (document, range, context) => {
      const currentDiagnostic = findDiagnosticByCode(
        context.diagnostics,
        'deprecatedPluginPath',
        range
      );

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
        currentDiagnostic.range,
        correctPluginPath,
      );
      fixes.push(individualFix);

      // Bulk fix for all deprecated plugin paths in the document
      const allDeprecated = getDiagnosticsByCode(document.uri, 'deprecatedPluginPath');

      if (allDeprecated.length > 1) {
        const bulkFix = new vscode.CodeAction(
          'Update all plugin paths',
          vscode.CodeActionKind.QuickFix,
        );
        bulkFix.edit = new vscode.WorkspaceEdit();

        allDeprecated.forEach(diagnostic => {
          bulkFix.edit!.replace(document.uri, diagnostic.range, correctPluginPath);
        });

        bulkFix.isPreferred = true;
        fixes.push(bulkFix);
      } else {
        individualFix.isPreferred = true;
      }

      return fixes;
    },
  };

  registerJsonCodeActionProvider(context, deprecatedPluginPaths);
}

function registerLanguageModelFixes(context: vscode.ExtensionContext) {
  const languageModelMissing: vscode.CodeActionProvider = {
    provideCodeActions: (document, range, context) => {
      const currentDiagnostic = findDiagnosticByCode(
        context.diagnostics,
        'missingLanguageModel',
        range
      );

      if (!currentDiagnostic) {
        return [];
      }

      const fix = new vscode.CodeAction(
        'Add languageModel configuration',
        vscode.CodeActionKind.QuickFix,
      );
      
      fix.edit = new vscode.WorkspaceEdit();
      
      try {
        const documentNode = parse(document.getText()) as parse.ObjectNode;
        
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
            fix.edit.replace(
              document.uri,
              getRangeFromASTNode(enabledNode.value),
              'true'
            );
          } else {
            const insertPosition = new vscode.Position(
              languageModelObjectNode.loc!.end.line - 1,
              languageModelObjectNode.loc!.end.column - 1
            );
            fix.edit.insert(
              document.uri,
              insertPosition,
              '\n    "enabled": true'
            );
          }
        } else {
          // Add new languageModel object after the last property
          const lastProperty = documentNode.children[documentNode.children.length - 1] as parse.PropertyNode;
          const insertPosition = new vscode.Position(
            lastProperty.loc!.end.line - 1,
            lastProperty.loc!.end.column
          );
          
          fix.edit.insert(
            document.uri,
            insertPosition,
            ',\n  "languageModel": {\n    "enabled": true\n  }'
          );
        }
      } catch {
        // Fallback to simple text-based insertion
        const lines = document.getText().split('\n');
        
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
        
        fix.edit.insert(
          document.uri,
          new vscode.Position(insertLine, 0),
          languageModelConfig + '\n'
        );
      }
      
      fix.isPreferred = true;
      return [fix];
    },
  };

  registerJsonCodeActionProvider(context, languageModelMissing);
}
