import * as vscode from 'vscode';
import parse from 'json-to-ast';
import { pluginSnippets } from './data';
import { getASTNode, getRangeFromASTNode } from './utils';
import {DevProxyInstall, PluginConfig} from './types';
import { DiagnosticCodes } from './constants';
import { getDiagnosticCode } from './utils';
import * as semver from 'semver';
import { fetchSchema, validateAgainstSchema } from './services';

export const updateConfigFileDiagnostics = async (
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): Promise<void> => {
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
  checkConfigSectionSchemas(documentNode, devProxyInstall, diagnostics);
  checkLanguageModelRequirements(documentNode, diagnostics);
  checkUrlsToWatch(documentNode, diagnostics);

  // Set initial diagnostics synchronously
  collection.set(document.uri, diagnostics);

  // Run async schema content validation and update diagnostics
  const asyncDiagnostics = await validateConfigSectionContents(document, documentNode);
  if (asyncDiagnostics.length > 0) {
    collection.set(document.uri, [...diagnostics, ...asyncDiagnostics]);
  }
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
        diagnostic.code = getDiagnosticCode(DiagnosticCodes.pluginConfigOptional);
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

/**
 * Check config section $schema properties for version mismatches.
 * Config sections can have their own $schema property that should match the installed Dev Proxy version.
 */
function checkConfigSectionSchemas(
  documentNode: parse.ObjectNode,
  devProxyInstall: DevProxyInstall,
  diagnostics: vscode.Diagnostic[],
) {
  const devProxyVersion = devProxyInstall.isBeta
    ? devProxyInstall.version.split('-')[0]
    : devProxyInstall.version;

  // Find all object properties that could be config sections (excluding known non-config properties)
  const nonConfigProperties = ['$schema', 'plugins', 'urlsToWatch', 'logLevel', 
    'newVersionNotification', 'showSkipMessages', 'languageModel', 'rate', 'labelMode'];

  documentNode.children.forEach(property => {
    const propertyNode = property as parse.PropertyNode;
    const propertyName = propertyNode.key.value as string;

    // Skip non-config section properties
    if (nonConfigProperties.includes(propertyName)) {
      return;
    }

    // Check if this property is an object (config sections are objects)
    if (propertyNode.value.type !== 'Object') {
      return;
    }

    const configSectionObject = propertyNode.value as parse.ObjectNode;
    
    // Look for $schema property within the config section
    const schemaNode = getASTNode(configSectionObject.children, 'Identifier', '$schema');
    
    if (schemaNode) {
      const schemaValueNode = schemaNode.value as parse.LiteralNode;
      const schemaValue = schemaValueNode.value as string;
      
      // Check if the schema version matches the installed Dev Proxy version
      if (!schemaValue.includes(`${devProxyVersion}`)) {
        const diagnostic = new vscode.Diagnostic(
          getRangeFromASTNode(schemaValueNode),
          `Config section schema version is not compatible with the installed version of Dev Proxy. Expected v${devProxyVersion}`,
          vscode.DiagnosticSeverity.Warning,
        );
        diagnostic.code = getDiagnosticCode(DiagnosticCodes.invalidConfigSectionSchema);
        diagnostics.push(diagnostic);
      }
    }
  });
}

/**
 * Validate config section contents against their schemas.
 * This is an async function that fetches schemas and validates properties.
 */
async function validateConfigSectionContents(
  document: vscode.TextDocument,
  documentNode: parse.ObjectNode,
): Promise<vscode.Diagnostic[]> {
  const diagnostics: vscode.Diagnostic[] = [];
  
  // Find all object properties that could be config sections (excluding known non-config properties)
  const nonConfigProperties = ['$schema', 'plugins', 'urlsToWatch', 'logLevel', 
    'newVersionNotification', 'showSkipMessages', 'languageModel', 'rate', 'labelMode'];

  const validationPromises: Promise<void>[] = [];

  documentNode.children.forEach(property => {
    const propertyNode = property as parse.PropertyNode;
    const propertyName = propertyNode.key.value as string;

    // Skip non-config section properties
    if (nonConfigProperties.includes(propertyName)) {
      return;
    }

    // Check if this property is an object (config sections are objects)
    if (propertyNode.value.type !== 'Object') {
      return;
    }

    const configSectionObject = propertyNode.value as parse.ObjectNode;
    
    // Look for $schema property within the config section
    const schemaNode = getASTNode(configSectionObject.children, 'Identifier', '$schema');
    
    if (!schemaNode) {
      return;
    }

    const schemaUrl = (schemaNode.value as parse.LiteralNode).value as string;
    
    // Parse the config section content from the document
    const promise = validateSingleConfigSection(
      document,
      configSectionObject,
      schemaUrl,
      propertyName,
      diagnostics,
    );
    validationPromises.push(promise);
  });

  await Promise.all(validationPromises);
  return diagnostics;
}

/**
 * Validate a single config section against its schema.
 */
async function validateSingleConfigSection(
  document: vscode.TextDocument,
  configSectionObject: parse.ObjectNode,
  schemaUrl: string,
  configSectionName: string,
  diagnostics: vscode.Diagnostic[],
): Promise<void> {
  try {
    const schema = await fetchSchema(schemaUrl);
    if (!schema) {
      // Schema couldn't be fetched - skip validation
      return;
    }

    // Convert AST to plain object for validation
    const configObject = astToObject(configSectionObject);
    
    const result = validateAgainstSchema(configObject, schema);
    
    if (!result.valid) {
      result.errors.forEach(error => {
        const diagnostic = createDiagnosticForValidationError(
          document,
          configSectionObject,
          error,
          configSectionName,
        );
        if (diagnostic) {
          diagnostics.push(diagnostic);
        }
      });
    }
  } catch (error) {
    console.warn(`Error validating config section ${configSectionName}:`, error);
  }
}

/**
 * Convert an AST ObjectNode to a plain JavaScript object.
 */
function astToObject(node: parse.ObjectNode): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  
  node.children.forEach(child => {
    const propertyNode = child as parse.PropertyNode;
    const key = propertyNode.key.value as string;
    const value = astValueToJS(propertyNode.value);
    obj[key] = value;
  });
  
  return obj;
}

/**
 * Convert an AST value node to a JavaScript value.
 */
function astValueToJS(node: parse.ValueNode): unknown {
  switch (node.type) {
    case 'Literal':
      return (node as parse.LiteralNode).value;
    case 'Object':
      return astToObject(node as parse.ObjectNode);
    case 'Array':
      return (node as parse.ArrayNode).children.map(astValueToJS);
    default:
      return undefined;
  }
}

/**
 * Create a diagnostic for a validation error, locating the property in the AST.
 */
function createDiagnosticForValidationError(
  document: vscode.TextDocument,
  configSectionObject: parse.ObjectNode,
  error: { path: string; message: string; keyword: string; params?: Record<string, unknown> },
  configSectionName: string,
): vscode.Diagnostic | undefined {
  let targetNode: parse.PropertyNode | parse.ValueNode | undefined;
  let diagnosticCode: string;
  let severity: vscode.DiagnosticSeverity;

  // Determine the diagnostic code and severity based on the error type
  if (error.keyword === 'additionalProperties') {
    diagnosticCode = DiagnosticCodes.unknownConfigProperty;
    severity = vscode.DiagnosticSeverity.Warning;
    
    // Find the unknown property node
    const unknownPropertyName = error.params?.additionalProperty as string;
    if (unknownPropertyName) {
      targetNode = getASTNode(configSectionObject.children, 'Identifier', unknownPropertyName);
    }
  } else {
    diagnosticCode = DiagnosticCodes.invalidConfigValue;
    severity = vscode.DiagnosticSeverity.Error;
    
    // Navigate to the error location using the JSON path
    targetNode = findNodeByPath(configSectionObject, error.path);
  }

  if (!targetNode) {
    // Fallback: use the config section name as the location
    return undefined;
  }

  const range = getRangeFromASTNode(
    targetNode.type === 'Property' ? (targetNode as parse.PropertyNode).key : targetNode
  );

  const diagnostic = new vscode.Diagnostic(
    range,
    `${configSectionName}: ${error.message}`,
    severity,
  );
  diagnostic.code = getDiagnosticCode(diagnosticCode);
  
  return diagnostic;
}

/**
 * Find a node in the AST by JSON pointer path (e.g., "/property/nested").
 */
function findNodeByPath(
  node: parse.ObjectNode,
  path: string,
): parse.PropertyNode | parse.ValueNode | undefined {
  if (!path || path === '/') {
    return node;
  }

  // Remove leading slash and split by /
  const parts = path.replace(/^\//, '').split('/');
  let currentNode: parse.ValueNode = node;

  for (const part of parts) {
    if (currentNode.type === 'Object') {
      const objectNode = currentNode as parse.ObjectNode;
      const propertyNode = getASTNode(objectNode.children, 'Identifier', part);
      if (!propertyNode) {
        return undefined;
      }
      // Return the property node for the last part
      if (part === parts[parts.length - 1]) {
        return propertyNode;
      }
      currentNode = propertyNode.value;
    } else if (currentNode.type === 'Array') {
      const arrayNode = currentNode as parse.ArrayNode;
      const index = parseInt(part, 10);
      if (isNaN(index) || index < 0 || index >= arrayNode.children.length) {
        return undefined;
      }
      currentNode = arrayNode.children[index];
    } else {
      return undefined;
    }
  }

  return currentNode;
}
