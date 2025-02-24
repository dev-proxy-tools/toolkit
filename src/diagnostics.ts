import * as vscode from 'vscode';
import parse from "json-to-ast";
import { pluginSnippets } from "./constants";
import { getASTNode, getRangeFromASTNode } from "./helpers";
import { DevProxyInstall, PluginConfig } from "./types";

export const updateConfigFileDiagnostics = (
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void => {
  const devProxyInstall = context.globalState.get<DevProxyInstall>('devProxyInstall');
  if (!devProxyInstall) {
    return;
  }
  const diagnostics: vscode.Diagnostic[] = [];
  const documentNode = getObjectNodeFromDocument(document);
  const pluginsNode = getPluginsNode(documentNode);

  checkSchemaCompatibility(documentNode, devProxyInstall, diagnostics);
  checkPlugins(pluginsNode, diagnostics, documentNode);
  checkConfigSection(documentNode, diagnostics);

  collection.set(document.uri, diagnostics);
};

export const updateFileDiagnostics = (
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void => {
  const devProxyInstall = context.globalState.get<DevProxyInstall>('devProxyInstall');
  if (!devProxyInstall) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const documentNode = getObjectNodeFromDocument(document);

  checkSchemaCompatibility(documentNode, devProxyInstall, diagnostics);

  collection.set(document.uri, diagnostics);
};

const checkConfigSection = (documentNode: parse.ObjectNode, diagnostics: vscode.Diagnostic[]) => {
  const objects = documentNode.children.filter((node) => node.type === 'Property' && (node as parse.PropertyNode).value.type === 'Object');

  objects.forEach((object) => {
    const objectNode = object as parse.PropertyNode;
    const objectName = objectNode.key.value as string;
    const pluginNodes = getPluginsNode(documentNode);

    if (objectName === 'languageModel') {
      return;
    }

    if (pluginNodes && pluginNodes.value.type === 'Array') {
      const plugins = (pluginNodes.value as parse.ArrayNode).children as parse.ObjectNode[];
      const matchFound = plugins.some((plugin) => {
        const configSectionNode = getASTNode(
          plugin.children,
          'Identifier',
          'configSection'
        );
        return configSectionNode && (configSectionNode.value as parse.LiteralNode).value === objectName;
      });

      if (matchFound) {
        return;
      }
    }

    const diagnostic = new vscode.Diagnostic(
      getRangeFromASTNode(objectNode),
      `Config section '${objectName}' does not correspond to any plugin. Remove it or add a plugin with a matching configSection.`,
      vscode.DiagnosticSeverity.Warning
    );
    diagnostic.code = 'invalidConfigSection';
    diagnostics.push(diagnostic);
  });
};

const checkSchemaCompatibility = (documentNode: parse.ObjectNode, devProxyInstall: DevProxyInstall, diagnostics: vscode.Diagnostic[]) => {
  const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');
  if (schemaNode) {
    const schemaValue = (schemaNode.value as parse.LiteralNode).value as string;
    const devProxyVersion = devProxyInstall.isBeta ? devProxyInstall.version.split('-')[0] : devProxyInstall.version;
    if (!schemaValue.includes(`${devProxyVersion}`)) {
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(schemaNode),
        `Schema version is not compatible with the installed version of Dev Proxy. Expected v${devProxyVersion}`,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.code = 'invalidSchema';
      diagnostics.push(diagnostic);
    }
  }
};

const checkPlugins = (pluginsNode: parse.PropertyNode | undefined, diagnostics: vscode.Diagnostic[], documentNode: parse.ObjectNode) => {
  if (pluginsNode &&
    (pluginsNode.value as parse.ArrayNode)) {
    const pluginNodes = (pluginsNode.value as parse.ArrayNode)
      .children as parse.ObjectNode[];

    checkAtLeastOneEnabledPlugin(pluginNodes, diagnostics, pluginsNode);
    warnOnReporterPosition(pluginNodes, diagnostics);
    validatePluginConfigurations(pluginNodes, diagnostics, documentNode);
  }
};

const validatePluginConfigurations = (pluginNodes: parse.ObjectNode[], diagnostics: vscode.Diagnostic[], documentNode: parse.ObjectNode) => {
  pluginNodes.forEach((pluginNode: parse.ObjectNode) => {
    const pluginNameNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'name'
    );
    const pluginName = (pluginNameNode?.value as parse.LiteralNode)
      .value as string;
    const enabledNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'enabled'
    );
    const isEnabled = (enabledNode?.value as parse.LiteralNode)
      .value as boolean;
    const pluginSnippet = pluginSnippets[pluginName];

    checkPluginConfiguration(pluginNode, diagnostics, pluginName, isEnabled, documentNode, pluginSnippet);
  });
};

const warnOnReporterPosition = (pluginNodes: parse.ObjectNode[], diagnostics: vscode.Diagnostic[]) => {
  const reporterIndex = pluginNodes.findIndex((pluginNode: parse.ObjectNode) => {
    const pluginNameNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'name'
    );
    const pluginName = (pluginNameNode?.value as parse.LiteralNode)
      .value as string;
    return pluginName.toLowerCase().includes('reporter');
  });

  if (reporterIndex !== -1) {
    // check if we have any more plugins after the reporter plugin
    const pluginsAfterReporter = pluginNodes.slice(reporterIndex + 1);
    // if we do, add a warning to the reporter plugin stating that it should be the last plugin
    if (pluginsAfterReporter.length > 0) {
      // check if there are any plugins after the reporter plugin that are not reporters
      const pluginAfterReporter = pluginsAfterReporter.find((pluginNode: parse.ObjectNode) => {
        const pluginNameNode = getASTNode(
          pluginNode.children,
          'Identifier',
          'name'
        );
        const pluginName = (pluginNameNode?.value as parse.LiteralNode)
          .value as string;
        return !pluginName.toLowerCase().includes('reporter');
      });
      // if there are, add a warning to the reporter plugin
      if (pluginAfterReporter) {
        const diagnostic = new vscode.Diagnostic(
          getRangeFromASTNode(pluginNodes[reporterIndex]),
          'Reporters should be placed after other plugins.',
          vscode.DiagnosticSeverity.Warning
        );
        diagnostics.push(diagnostic);
      }
    }
  }
};

const checkAtLeastOneEnabledPlugin = (pluginNodes: parse.ObjectNode[], diagnostics: vscode.Diagnostic[], pluginsNode: parse.PropertyNode) => {
  // check if there are any plugins
  if (pluginNodes.length === 0) {
    diagnostics.push(
      new vscode.Diagnostic(
        getRangeFromASTNode(pluginsNode),
        'Add at least one plugin',
        vscode.DiagnosticSeverity.Error
      )
    );
  } else {
    // check if there are any enabled plugins
    const enabledPlugins = pluginNodes.filter((pluginNode: parse.ObjectNode) => {
      const enabledNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'enabled'
      );
      return (enabledNode?.value as parse.LiteralNode).value as boolean;
    });
    if (enabledPlugins.length === 0) {
      diagnostics.push(
        new vscode.Diagnostic(
          getRangeFromASTNode(pluginsNode),
          'At least one plugin must be enabled',
          vscode.DiagnosticSeverity.Error
        )
      );
    }
  }
};

const checkPluginConfiguration = (pluginNode: parse.ObjectNode, diagnostics: vscode.Diagnostic[], pluginName: string, isEnabled: boolean, documentNode: parse.ObjectNode, pluginSnippet: { instance: string; config?: PluginConfig; }) => {
  const configSectionNode = getASTNode(
    pluginNode.children,
    'Identifier',
    'configSection'
  );

  // if the plugin does not require a config section, we should not have one
  if (!pluginSnippet.config && configSectionNode) {
    diagnostics.push(
      new vscode.Diagnostic(
        getRangeFromASTNode(configSectionNode),
        `${pluginName} does not require a config section.`,
        isEnabled
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning
      )
    );
    return;
  }

  // if there is no config section defined on the plugin, we should have one if the plugin requires it
  if (!configSectionNode) {
    if (pluginSnippet.config?.required) {
      diagnostics.push(
        new vscode.Diagnostic(
          getRangeFromASTNode(pluginNode),
          `${pluginName} requires a config section.`,
          isEnabled
            ? vscode.DiagnosticSeverity.Error
            : vscode.DiagnosticSeverity.Warning
        )
      );
    } else if (pluginSnippet.config?.required === false) {
      const pluginNameNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'name'
      );
      if (pluginNameNode) {
        diagnostics.push(
          new vscode.Diagnostic(
            getRangeFromASTNode(pluginNameNode.value),
            `${pluginName} can be configured with a configSection. Use '${pluginSnippet.config?.name}' snippet to create one.`,
            vscode.DiagnosticSeverity.Information
          )
        );
      }
    }
  } else {
    // if there is a config section defined on the plugin, we should have the config section defined in the document
    const configSectionName = (
      configSectionNode.value as parse.LiteralNode
    ).value as string;
    const configSection = getASTNode(
      documentNode.children,
      'Identifier',
      configSectionName
    );

    if (!configSection) {
      diagnostics.push(
        new vscode.Diagnostic(
          getRangeFromASTNode(configSectionNode.value),
          `${configSectionName} config section is missing. Use '${pluginSnippet.config?.name}' snippet to create one.`,
          isEnabled
            ? vscode.DiagnosticSeverity.Error
            : vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }
};

const getPluginsNode = (documentNode: parse.ObjectNode) => {
  return getASTNode(
    documentNode.children,
    'Identifier',
    'plugins'
  );
};

const getObjectNodeFromDocument = (document: vscode.TextDocument): parse.ObjectNode => {
  return parse(document.getText()) as parse.ObjectNode;
};

