import * as vscode from 'vscode';
import { isConfigFile, isProxyFile } from './utils';
import { updateFileDiagnostics, updateConfigFileDiagnostics } from './diagnostics';
import * as logger from './logger';

export const registerDocumentListeners = (context: vscode.ExtensionContext, collection: vscode.DiagnosticCollection) => {
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.uri.scheme !== 'file') {
                return;
            }
            try {
                if (isProxyFile(document)) {
                    logger.debug('Proxy file opened', { path: document.uri.fsPath });
                    updateFileDiagnostics(context, document, collection);
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                }
                if (!isConfigFile(document)) {
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                    return;
                } else {
                    logger.debug('Config file opened', { path: document.uri.fsPath });
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', true);
                    updateConfigFileDiagnostics(context, document, collection);
                }
            } catch (error) {
                logger.error('Error handling document open', error);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.uri.scheme !== 'file') {
                return;
            }
            try {
                if (!isConfigFile(event.document) && !isProxyFile(event.document)) {
                    collection.delete(event.document.uri);
                    return;
                }
                if (isConfigFile(event.document)) {
                    logger.debug('Config file changed', { path: event.document.uri.fsPath });
                    updateConfigFileDiagnostics(context, event.document, collection);
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', true);
                    return;
                }
                if (isProxyFile(event.document)) {
                    logger.debug('Proxy file changed', { path: event.document.uri.fsPath });
                    updateFileDiagnostics(context, event.document, collection);
                    vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', false);
                }
            } catch (error) {
                logger.error('Error handling document change', error);
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

    // Process already-open documents that were opened before the extension activated
    for (const document of vscode.workspace.textDocuments) {
        if (document.uri.scheme !== 'file') {
            continue;
        }
        try {
            if (isConfigFile(document)) {
                updateConfigFileDiagnostics(context, document, collection);
            } else if (isProxyFile(document)) {
                updateFileDiagnostics(context, document, collection);
            }
        } catch (error) {
            console.error('Error processing already-open document:', document.uri.fsPath, error);
        }
    }

    // Set context for the active editor if it contains a config file
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
        vscode.commands.executeCommand('setContext', 'isDevProxyConfigFile', isConfigFile(activeEditor.document));
    }
};
