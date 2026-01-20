import Ajv, { ErrorObject } from 'ajv';

/**
 * Schema cache to avoid fetching the same schema multiple times.
 * Key is the schema URL, value is the parsed schema object.
 */
const schemaCache: Map<string, object> = new Map();

/**
 * Ajv instance for JSON Schema validation.
 * Configured with strict mode off to allow draft-07 schemas.
 */
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
});

/**
 * Result of schema validation.
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

/**
 * A validation error with location information.
 */
export interface SchemaValidationError {
  /** JSON pointer to the invalid property (e.g., "/mocksFile") */
  path: string;
  /** Human-readable error message */
  message: string;
  /** The type of error (additionalProperty, type, required, etc.) */
  keyword: string;
  /** The invalid value if applicable */
  data?: unknown;
  /** Additional parameters from the schema (e.g., allowed values) */
  params?: Record<string, unknown>;
}

/**
 * Fetch a JSON schema from a URL with caching.
 * @param schemaUrl The URL of the schema to fetch
 * @returns The parsed schema object, or undefined if fetch failed
 */
export async function fetchSchema(schemaUrl: string): Promise<object | undefined> {
  // Check cache first
  if (schemaCache.has(schemaUrl)) {
    return schemaCache.get(schemaUrl);
  }

  try {
    const response = await fetch(schemaUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch schema from ${schemaUrl}: ${response.status}`);
      return undefined;
    }

    const schema = await response.json() as object;
    schemaCache.set(schemaUrl, schema);
    return schema;
  } catch (error) {
    console.warn(`Error fetching schema from ${schemaUrl}:`, error);
    return undefined;
  }
}

/**
 * Clear the schema cache. Useful for testing or when schemas are updated.
 */
export function clearSchemaCache(): void {
  schemaCache.clear();
  // Also clear Ajv's compiled schemas
  ajv.removeSchema();
}

/**
 * Get the number of cached schemas.
 */
export function getSchemaCacheSize(): number {
  return schemaCache.size;
}

/**
 * Validate a config section object against a JSON schema.
 * @param configSection The config section object to validate (without the $schema property)
 * @param schema The JSON schema to validate against
 * @returns Validation result with any errors
 */
export function validateAgainstSchema(
  configSection: Record<string, unknown>,
  schema: object
): SchemaValidationResult {
  // Remove $schema from the config section before validation
  // (it's not part of the actual config data)
  const dataToValidate = { ...configSection };
  delete dataToValidate['$schema'];

  const validate = ajv.compile(schema);
  const valid = validate(dataToValidate);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: SchemaValidationError[] = (validate.errors || []).map(
    (error: ErrorObject) => ({
      path: error.instancePath || '/',
      message: formatErrorMessage(error),
      keyword: error.keyword,
      data: error.data,
      params: error.params as Record<string, unknown>,
    })
  );

  return { valid: false, errors };
}

/**
 * Format an Ajv error into a human-readable message.
 */
function formatErrorMessage(error: ErrorObject): string {
  switch (error.keyword) {
    case 'additionalProperties':
      return `Unknown property '${error.params.additionalProperty}'`;
    case 'required':
      return `Missing required property '${error.params.missingProperty}'`;
    case 'type':
      return `Expected ${error.params.type}, got ${typeof error.data}`;
    case 'enum':
      return `Invalid value. Allowed values: ${(error.params.allowedValues as string[]).join(', ')}`;
    case 'minimum':
      return `Value must be >= ${error.params.limit}`;
    case 'maximum':
      return `Value must be <= ${error.params.limit}`;
    case 'minLength':
      return `String must be at least ${error.params.limit} characters`;
    case 'maxLength':
      return `String must be at most ${error.params.limit} characters`;
    case 'pattern':
      return `String does not match pattern ${error.params.pattern}`;
    case 'format':
      return `Invalid format. Expected ${error.params.format}`;
    default:
      return error.message || `Validation error: ${error.keyword}`;
  }
}

/**
 * Validate a config section by fetching its schema and validating.
 * This is a convenience function that combines fetchSchema and validateAgainstSchema.
 * @param configSection The config section object including the $schema property
 * @returns Validation result, or undefined if no $schema or schema couldn't be fetched
 */
export async function validateConfigSection(
  configSection: Record<string, unknown>
): Promise<SchemaValidationResult | undefined> {
  const schemaUrl = configSection['$schema'] as string | undefined;
  if (!schemaUrl) {
    return undefined;
  }

  const schema = await fetchSchema(schemaUrl);
  if (!schema) {
    return undefined;
  }

  return validateAgainstSchema(configSection, schema);
}
