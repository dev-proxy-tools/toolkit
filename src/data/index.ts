import { PluginDocs, PluginSnippets } from '../types';
import pluginData from './plugins.json';

/**
 * Plugin configuration data loaded from plugins.json.
 *
 * This separation allows:
 * - Easy updates to plugin data without touching TypeScript code
 * - Potential future auto-generation of plugin data from Dev Proxy schemas
 * - Clear separation between static data and code logic
 */

/**
 * Plugin snippets used for IntelliSense and validation.
 * Maps plugin names to their snippet configurations.
 */
export const pluginSnippets: PluginSnippets = pluginData.plugins;

/**
 * Plugin documentation links.
 * Maps plugin names to their Microsoft Learn documentation URLs.
 */
export const pluginDocs: PluginDocs = pluginData.docs;

/**
 * Get all known plugin names.
 */
export function getPluginNames(): string[] {
  return Object.keys(pluginSnippets);
}

/**
 * Check if a plugin name is valid/known.
 */
export function isKnownPlugin(name: string): boolean {
  return name in pluginSnippets;
}

/**
 * Get the documentation URL for a plugin.
 */
export function getPluginDocUrl(name: string): string | undefined {
  return pluginDocs[name]?.url;
}

/**
 * Get plugins that require a language model.
 */
export function getLanguageModelPlugins(): string[] {
  return Object.entries(pluginSnippets)
    .filter(([_, config]) => config.requiresLanguageModel)
    .map(([name]) => name);
}

/**
 * Get plugins that require configuration.
 */
export function getPluginsRequiringConfig(): string[] {
  return Object.entries(pluginSnippets)
    .filter(([_, config]) => config.config?.required)
    .map(([name]) => name);
}
