import * as vscode from 'vscode';
import { isConfigFile, isProxyFile } from './utils';
import { updateFileDiagnostics, updateConfigFileDiagnostics } from './diagnostics';

export const registerDocumentListeners = (context: vscode.ExtensionContext, collection: vscode.DiagnosticCollection) => {
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            try {
                if (isProxyFile(document)) {
                    updateFileDiagnostics(context, document, collection);
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                }
                if (!isConfigFile(document)) {
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                    return;
                } else {
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', true);
                    updateConfigFileDiagnostics(context, document, collection);
                }
            } catch (error) {
                console.error('Error handling document open:', error);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            try {
                if (!isConfigFile(event.document) && !isProxyFile(event.document)) {
                    collection.delete(event.document.uri);
                    return;
                }
                if (isConfigFile(event.document)) {
                    updateConfigFileDiagnostics(context, event.document, collection);
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', true);
                    return;
                }
                if (isProxyFile(event.document)) {
                    updateFileDiagnostics(context, event.document, collection);
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                }
            } catch (error) {
                console.error('Error handling document change:', error);
            }
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(e => {
            if (!e) {
                vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                return;
            };
            isConfigFile(e.document) ?
                vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', true) :
                vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
        })
    );
    
    context.subscriptions.push(
        vscode.workspace.onDidDeleteFiles(e => {
            e.files.forEach(file => {
                const uri = file;
                collection.delete(uri);
            });
        })
    );
};
