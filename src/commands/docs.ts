import * as vscode from 'vscode';
import { Commands } from '../constants';
import { pluginDocs } from '../data';
import parse from 'json-to-ast';
import { getASTNode, getRangeFromASTNode } from '../utils/ast';

/**
 * Documentation and language model configuration commands.
 */

export function registerDocCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.openPluginDoc, openPluginDocumentation)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.addLanguageModelConfig, addLanguageModelConfig)
  );
}

function openPluginDocumentation(pluginName: string): void {
  const doc = pluginDocs[pluginName];
  if (doc) {
    const target = vscode.Uri.parse(doc.url);
    vscode.env.openExternal(target);
  }
}

async function addLanguageModelConfig(uri: vscode.Uri): Promise<void> {
  const document = await vscode.workspace.openTextDocument(uri);
  const edit = new vscode.WorkspaceEdit();

  try {
    const documentNode = parse(document.getText()) as parse.ObjectNode;

    const existingLanguageModel = getASTNode(documentNode.children, 'Identifier', 'languageModel');

    if (existingLanguageModel) {
      updateExistingLanguageModel(uri, edit, existingLanguageModel);
    } else {
      addNewLanguageModel(uri, edit, documentNode);
    }
  } catch (error) {
    // Fallback to simple text-based insertion
    addLanguageModelFallback(document, edit, uri);
  }

  await vscode.workspace.applyEdit(edit);
  await document.save();

  vscode.window.showInformationMessage('Language model configuration added');
}

function updateExistingLanguageModel(
  uri: vscode.Uri,
  edit: vscode.WorkspaceEdit,
  existingLanguageModel: parse.PropertyNode
): void {
  const languageModelObjectNode = existingLanguageModel.value as parse.ObjectNode;
  const enabledNode = getASTNode(languageModelObjectNode.children, 'Identifier', 'enabled');

  if (enabledNode) {
    // Replace the enabled value
    edit.replace(uri, getRangeFromASTNode(enabledNode.value), 'true');
  } else {
    // Add enabled property
    const insertPosition = new vscode.Position(
      languageModelObjectNode.loc!.end.line - 1,
      languageModelObjectNode.loc!.end.column - 1
    );
    edit.insert(uri, insertPosition, '\n    "enabled": true');
  }
}

function addNewLanguageModel(
  uri: vscode.Uri,
  edit: vscode.WorkspaceEdit,
  documentNode: parse.ObjectNode
): void {
  const lastProperty = documentNode.children[
    documentNode.children.length - 1
  ] as parse.PropertyNode;
  const insertPosition = new vscode.Position(
    lastProperty.loc!.end.line - 1,
    lastProperty.loc!.end.column
  );

  edit.insert(uri, insertPosition, ',\n  "languageModel": {\n    "enabled": true\n  }');
}

function addLanguageModelFallback(
  document: vscode.TextDocument,
  edit: vscode.WorkspaceEdit,
  uri: vscode.Uri
): void {
  const documentText = document.getText();
  const lines = documentText.split('\n');

  let insertLine = lines.length - 1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('}')) {
      insertLine = i;
      break;
    }
  }

  const hasContentBefore = lines
    .slice(0, insertLine)
    .some(
      line =>
        line.trim() &&
        !line.trim().startsWith('{') &&
        !line.trim().startsWith('/*') &&
        !line.trim().startsWith('*')
    );

  const languageModelConfig = hasContentBefore
    ? ',\n  "languageModel": {\n    "enabled": true\n  }'
    : '  "languageModel": {\n    "enabled": true\n  }';

  const insertPosition = new vscode.Position(insertLine, 0);
  edit.insert(uri, insertPosition, languageModelConfig + '\n');
}
