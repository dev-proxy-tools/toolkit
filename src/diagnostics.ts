import * as vscode from 'vscode';
import parse from 'json-to-ast';
import { pluginSnippets } from './data';
import { getASTNode, getRangeFromASTNode } from './utils';
import {DevProxyInstall, PluginConfig} from './types';
import { DiagnosticCodes } from './constants';
import { getDiagnosticCode } from './utils';
import * as semver from 'semver';

export const updateConfigFileDiagnostics = (
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void => {
  const devProxyInstall =
    context.globalState.get<DevProxyInstall>('devProxyInstall');
  if (!devProxyInstall) {
    return;
  }
  const diagnostics: vscode.Diagnostic[] = [];
  const documentNode = getObjectNodeFromDocument(document);
  const pluginsNode = getPluginsNode(documentNode);

  checkSchemaCompatibility(documentNode, devProxyInstall, diagnostics);
  checkPlugins(pluginsNode, diagnostics, documentNode, devProxyInstall);
  checkConfigSection(documentNode, diagnostics);
  checkLanguageModelRequirements(documentNode, diagnostics);
  checkUrlsToWatch(documentNode, diagnostics);

  collection.set(document.uri, diagnostics);
};

export const updateFileDiagnostics = (
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void => {
  const devProxyInstall =
    context.globalState.get<DevProxyInstall>('devProxyInstall');
  if (!devProxyInstall) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const documentNode = getObjectNodeFromDocument(document);

  checkSchemaCompatibility(documentNode, devProxyInstall, diagnostics);

  collection.set(document.uri, diagnostics);
};

const checkConfigSection = (
  documentNode: parse.ObjectNode,
  diagnostics: vscode.Diagnostic[],
) => {
  const objects = documentNode.children.filter(
    node =>
      node.type === 'Property' &&
      (node as parse.PropertyNode).value.type === 'Object',
  );

  objects.forEach(object => {
    const objectNode = object as parse.PropertyNode;
    const objectName = objectNode.key.value as string;
    const pluginNodes = getPluginsNode(documentNode);

    if (objectName === 'languageModel') {
      return;
    }

    if (pluginNodes && pluginNodes.value.type === 'Array') {
      const plugins = (pluginNodes.value as parse.ArrayNode)
        .children as parse.ObjectNode[];
      const matchFound = plugins.some(plugin => {
        const configSectionNode = getASTNode(
          plugin.children,
          'Identifier',
          'configSection',
        );
        return (
          configSectionNode &&
          (configSectionNode.value as parse.LiteralNode).value === objectName
        );
      });

      if (matchFound) {
        return;
      }
    }

    const diagnostic = new vscode.Diagnostic(
      getRangeFromASTNode(objectNode.key),
      `Config section '${objectName}' does not correspond to any plugin. Remove it or add a plugin with a matching configSection.`,
      vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.code = getDiagnosticCode(DiagnosticCodes.invalidConfigSection);
    diagnostics.push(diagnostic);
  });
};

const checkSchemaCompatibility = (
  documentNode: parse.ObjectNode,
  devProxyInstall: DevProxyInstall,
  diagnostics: vscode.Diagnostic[],
) => {
  const schemaNode = getASTNode(documentNode.children, 'Identifier', '$schema');
  if (schemaNode) {
    const schemaValueNode = schemaNode.value as parse.LiteralNode;
    const schemaValue = schemaValueNode.value as string;
    const devProxyVersion = devProxyInstall.isBeta
      ? devProxyInstall.version.split('-')[0]
      : devProxyInstall.version;
    if (!schemaValue.includes(`${devProxyVersion}`)) {
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(schemaValueNode),
        `Schema version is not compatible with the installed version of Dev Proxy. Expected v${devProxyVersion}`,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.invalidSchema);
      diagnostics.push(diagnostic);
    }
  }
};

const checkPlugins = (
  pluginsNode: parse.PropertyNode | undefined,
  diagnostics: vscode.Diagnostic[],
  documentNode: parse.ObjectNode,
  devProxyInstall?: DevProxyInstall,
) => {
  if (pluginsNode && (pluginsNode.value as parse.ArrayNode)) {
    const pluginNodes = (pluginsNode.value as parse.ArrayNode)
      .children as parse.ObjectNode[];

    checkAtLeastOneEnabledPlugin(pluginNodes, diagnostics, pluginsNode);
    warnOnReporterPosition(pluginNodes, diagnostics);
    validatePluginConfigurations(pluginNodes, diagnostics, documentNode);
    checkForSummaryPluginWithoutReporter(pluginNodes, diagnostics);
    checkAPICOnboardingPluginAfterOpenApiSpecGeneratorPlugin(
      pluginNodes,
      diagnostics,
    );
    checkDeprecatedPluginPath(
      pluginNodes,
      diagnostics,
      documentNode,
      devProxyInstall?.version,
    );
  }
};

const validatePluginConfigurations = (
  pluginNodes: parse.ObjectNode[],
  diagnostics: vscode.Diagnostic[],
  documentNode: parse.ObjectNode,
) => {
  pluginNodes.forEach((pluginNode: parse.ObjectNode) => {
    const pluginNameNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'name',
    );
    const pluginName = (pluginNameNode?.value as parse.LiteralNode)
      .value as string;
    const enabledNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'enabled',
    );
    const isEnabled = (enabledNode?.value as parse.LiteralNode)
      .value as boolean;
    const pluginSnippet = pluginSnippets[pluginName];

    // Skip validation for unknown plugins
    if (!pluginSnippet) {
      return;
    }

    checkPluginConfiguration(
      pluginNode,
      diagnostics,
      pluginName,
      isEnabled,
      documentNode,
      pluginSnippet,
    );
  });
};

const warnOnReporterPosition = (
  pluginNodes: parse.ObjectNode[],
  diagnostics: vscode.Diagnostic[],
) => {
  const reporterIndex = pluginNodes.findIndex(
    (pluginNode: parse.ObjectNode) => {
      const pluginNameNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'name',
      );
      const pluginName = (pluginNameNode?.value as parse.LiteralNode)
        .value as string;
      return pluginName.toLowerCase().includes('reporter');
    },
  );

  if (reporterIndex !== -1) {
    // check if we have any more plugins after the reporter plugin
    const pluginsAfterReporter = pluginNodes.slice(reporterIndex + 1);
    // if we do, add a warning to the reporter plugin stating that it should be the last plugin
    if (pluginsAfterReporter.length > 0) {
      // check if there are any plugins after the reporter plugin that are not reporters
      const pluginAfterReporter = pluginsAfterReporter.find(
        (pluginNode: parse.ObjectNode) => {
          const pluginNameNode = getASTNode(
            pluginNode.children,
            'Identifier',
            'name',
          );
          const pluginName = (pluginNameNode?.value as parse.LiteralNode)
            .value as string;
          return !pluginName.toLowerCase().includes('reporter');
        },
      );
      // if there are, add a warning to the reporter plugin
      if (pluginAfterReporter) {
        const reporterPluginNameNode = getASTNode(
          pluginNodes[reporterIndex].children,
          'Identifier',
          'name',
        );
        const diagnostic = new vscode.Diagnostic(
          getRangeFromASTNode(reporterPluginNameNode!.value),
          'Reporters should be placed after other plugins.',
          vscode.DiagnosticSeverity.Warning,
        );
        diagnostic.code = getDiagnosticCode(DiagnosticCodes.reporterPosition);
        diagnostics.push(diagnostic);
      }
    }
  }
};

const checkAtLeastOneEnabledPlugin = (
  pluginNodes: parse.ObjectNode[],
  diagnostics: vscode.Diagnostic[],
  pluginsNode: parse.PropertyNode,
) => {
  // check if there are any plugins
  if (pluginNodes.length === 0) {
    const diagnostic = new vscode.Diagnostic(
      getRangeFromASTNode(pluginsNode.key),
      'Add at least one plugin',
      vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.code = getDiagnosticCode(DiagnosticCodes.noEnabledPlugins);
    diagnostics.push(diagnostic);
  } else {
    // check if there are any enabled plugins
    const enabledPlugins = pluginNodes.filter(
      (pluginNode: parse.ObjectNode) => {
        const enabledNode = getASTNode(
          pluginNode.children,
          'Identifier',
          'enabled',
        );
        return (enabledNode?.value as parse.LiteralNode).value as boolean;
      },
    );
    if (enabledPlugins.length === 0) {
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(pluginsNode.key),
        'At least one plugin must be enabled',
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.noEnabledPlugins);
      diagnostics.push(diagnostic);
    }
  }
};

const checkPluginConfiguration = (
  pluginNode: parse.ObjectNode,
  diagnostics: vscode.Diagnostic[],
  pluginName: string,
  isEnabled: boolean,
  documentNode: parse.ObjectNode,
  pluginSnippet: {instance: string; config?: PluginConfig},
) => {
  const configSectionNode = getASTNode(
    pluginNode.children,
    'Identifier',
    'configSection',
  );

  // if the plugin does not require a config section, we should not have one
  if (!pluginSnippet.config && configSectionNode) {
    const diagnostic = new vscode.Diagnostic(
      getRangeFromASTNode(configSectionNode),
      `${pluginName} does not require a config section.`,
      isEnabled
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.code = getDiagnosticCode(DiagnosticCodes.pluginConfigNotRequired);
    diagnostics.push(diagnostic);
    return;
  }

  // if there is no config section defined on the plugin, we should have one if the plugin requires it
  if (!configSectionNode) {
    if (pluginSnippet.config?.required) {
      const pluginNameNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'name',
      );
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(pluginNameNode!.value),
        `${pluginName} requires a config section.`,
        isEnabled
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.pluginConfigRequired);
      diagnostics.push(diagnostic);
    } else if (pluginSnippet.config?.required === false) {
      const pluginNameNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'name',
      );
      if (pluginNameNode) {
        const diagnostic = new vscode.Diagnostic(
          getRangeFromASTNode(pluginNameNode.value),
          `${pluginName} can be configured with a configSection. Use '${pluginSnippet.config?.name}' snippet to create one.`,
          vscode.DiagnosticSeverity.Information,
        );
        diagnostics.push(diagnostic);
      }
    }
  } else {
    // if there is a config section defined on the plugin, we should have the config section defined in the document
    const configSectionName = (configSectionNode.value as parse.LiteralNode)
      .value as string;
    const configSection = getASTNode(
      documentNode.children,
      'Identifier',
      configSectionName,
    );

    if (!configSection) {
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(configSectionNode.value),
        `${configSectionName} config section is missing. Use '${pluginSnippet.config?.name}' snippet to create one.`,
        isEnabled
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.pluginConfigMissing);
      diagnostics.push(diagnostic);
    }
  }
};

const getPluginsNode = (documentNode: parse.ObjectNode) => {
  return getASTNode(documentNode.children, 'Identifier', 'plugins');
};

const getObjectNodeFromDocument = (
  document: vscode.TextDocument,
): parse.ObjectNode => {
  return parse(document.getText()) as parse.ObjectNode;
};

function checkForSummaryPluginWithoutReporter(
  pluginNodes: parse.ObjectNode[],
  diagnostics: vscode.Diagnostic[],
) {
  const summaryPluginNames = ['ExecutionSummaryPlugin', 'UrlDiscoveryPlugin'];

  const summaryPlugin = pluginNodes.find((pluginNode: parse.ObjectNode) => {
    const pluginNameNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'name',
    );
    const pluginName = (pluginNameNode?.value as parse.LiteralNode)
      .value as string;
    const enabledNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'enabled',
    );
    const isEnabled = (enabledNode?.value as parse.LiteralNode)
      .value as boolean;
    return summaryPluginNames.includes(pluginName) && isEnabled;
  });

  if (summaryPlugin) {
    const reporterPlugin = pluginNodes.find((pluginNode: parse.ObjectNode) => {
      const pluginNameNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'name',
      );
      const pluginName = (pluginNameNode?.value as parse.LiteralNode)
        .value as string;
      const enabledNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'enabled',
      );
      const isEnabled = (enabledNode?.value as parse.LiteralNode)
        .value as boolean;
      return pluginName.toLowerCase().includes('reporter') && isEnabled;
    });

    if (!reporterPlugin) {
      const summaryPluginNameNode = getASTNode(
        summaryPlugin.children,
        'Identifier',
        'name',
      );
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(summaryPluginNameNode!.value),
        `Summary plugins should be used with a reporter plugin.`,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.summaryWithoutReporter);
      diagnostics.push(diagnostic);
    }
  }
}

function checkAPICOnboardingPluginAfterOpenApiSpecGeneratorPlugin(
  pluginNodes: parse.ObjectNode[],
  diagnostics: vscode.Diagnostic[],
) {
  const openApiSpecGeneratorPluginIndex = pluginNodes.findIndex(
    (pluginNode: parse.ObjectNode) => {
      const pluginNameNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'name',
      );
      const pluginName = (pluginNameNode?.value as parse.LiteralNode)
        .value as string;
      const enabledNode = getASTNode(
        pluginNode.children,
        'Identifier',
        'enabled',
      );
      const isEnabled = (enabledNode?.value as parse.LiteralNode)
        .value as boolean;
      return pluginName === 'OpenApiSpecGeneratorPlugin' && isEnabled;
    },
  );
  if (openApiSpecGeneratorPluginIndex !== -1) {
    const apiCenterOnboardingPluginIndex = pluginNodes.findIndex(
      (pluginNode: parse.ObjectNode) => {
        const pluginNameNode = getASTNode(
          pluginNode.children,
          'Identifier',
          'name',
        );
        const pluginName = (pluginNameNode?.value as parse.LiteralNode)
          .value as string;
        return pluginName === 'ApiCenterOnboardingPlugin';
      },
    );
    if (
      apiCenterOnboardingPluginIndex !== -1 &&
      apiCenterOnboardingPluginIndex < openApiSpecGeneratorPluginIndex
    ) {
      const openApiPluginNameNode = getASTNode(
        pluginNodes[openApiSpecGeneratorPluginIndex].children,
        'Identifier',
        'name',
      );
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(openApiPluginNameNode!.value),
        'OpenApiSpecGeneratorPlugin should be placed before ApiCenterOnboardingPlugin.',
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.apiCenterPluginOrder);
      diagnostics.push(diagnostic);
    }
  }
}

function checkDeprecatedPluginPath(
  pluginNodes: parse.ObjectNode[],
  diagnostics: vscode.Diagnostic[],
  documentNode: parse.ObjectNode,
  version: string | undefined,
) {
  if (!version || semver.lt(version, '0.29.0')) {
    return;
  }

  // Check each plugin for deprecated pluginPath
  pluginNodes.forEach((pluginNode: parse.ObjectNode) => {
    const pluginPathNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'pluginPath',
    );

    if (pluginPathNode) {
      const pluginPath = (pluginPathNode.value as parse.LiteralNode)
        .value as string;

      // Check for old plugin path format
      if (pluginPath === '~appFolder/plugins/dev-proxy-plugins.dll') {
        const diagnostic = new vscode.Diagnostic(
          getRangeFromASTNode(pluginPathNode.value),
          `The pluginPath '${pluginPath}' was deprecated in v0.29. Use '~appFolder/plugins/DevProxy.Plugins.dll' instead.`,
          vscode.DiagnosticSeverity.Error,
        );
        diagnostic.code = getDiagnosticCode(DiagnosticCodes.deprecatedPluginPath);
        diagnostics.push(diagnostic);
      }
    }
  });
}

function checkLanguageModelRequirements(
  documentNode: parse.ObjectNode,
  diagnostics: vscode.Diagnostic[],
) {
  const pluginsNode = getPluginsNode(documentNode);
  
  if (!pluginsNode || pluginsNode.value.type !== 'Array') {
    return;
  }

  const pluginNodes = (pluginsNode.value as parse.ArrayNode)
    .children as parse.ObjectNode[];

  // Check if languageModel is enabled
  const languageModelNode = getASTNode(
    documentNode.children,
    'Identifier',
    'languageModel'
  );
  let isLanguageModelEnabled = false;
  
  if (languageModelNode && languageModelNode.value.type === 'Object') {
    const languageModelObjectNode = languageModelNode.value as parse.ObjectNode;
    const enabledNode = getASTNode(
      languageModelObjectNode.children,
      'Identifier',
      'enabled'
    );
    if (enabledNode && enabledNode.value.type === 'Literal') {
      isLanguageModelEnabled = (enabledNode.value as parse.LiteralNode).value as boolean;
    }
  }

  // Check each plugin that requires language model
  pluginNodes.forEach((pluginNode: parse.ObjectNode) => {
    const pluginNameNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'name',
    );
    
    if (!pluginNameNode) {
      return;
    }

    const pluginName = (pluginNameNode.value as parse.LiteralNode).value as string;
    const pluginSnippet = pluginSnippets[pluginName];
    
    if (!pluginSnippet?.requiresLanguageModel) {
      return;
    }

    // Check if plugin is enabled
    const enabledNode = getASTNode(
      pluginNode.children,
      'Identifier',
      'enabled',
    );
    const isPluginEnabled = enabledNode ? 
      (enabledNode.value as parse.LiteralNode).value as boolean : false;

    if (isPluginEnabled && !isLanguageModelEnabled) {
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(pluginNameNode.value),
        `${pluginName} requires languageModel.enabled to be set to true.`,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.missingLanguageModel);
      diagnostics.push(diagnostic);
    }
  });
}

function checkUrlsToWatch(
  documentNode: parse.ObjectNode,
  diagnostics: vscode.Diagnostic[],
) {
  const urlsToWatchNode = getASTNode(
    documentNode.children,
    'Identifier',
    'urlsToWatch',
  );

  if (urlsToWatchNode && urlsToWatchNode.value.type === 'Array') {
    const urlsArray = urlsToWatchNode.value as parse.ArrayNode;
    if (urlsArray.children.length === 0) {
      const diagnostic = new vscode.Diagnostic(
        getRangeFromASTNode(urlsToWatchNode.key),
        'urlsToWatch is empty. Add URLs to intercept requests.',
        vscode.DiagnosticSeverity.Information,
      );
      diagnostic.code = getDiagnosticCode(DiagnosticCodes.emptyUrlsToWatch);
      diagnostics.push(diagnostic);
    }
  }
}
