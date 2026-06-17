import type { JSONSchemaLike } from './types';
import { resolveUnion } from './example';

export interface SchemaTreeNode {
  /** Property name, or `name[]` for arrays. */
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  children?: SchemaTreeNode[];
}

function resolveType(schema: JSONSchemaLike): { type: string; nullable: boolean } {
  const rawType = schema.type;
  if (Array.isArray(rawType)) {
    const types = rawType as string[];
    return { type: types.find((t) => t !== 'null') ?? 'unknown', nullable: types.includes('null') };
  }
  if (typeof rawType === 'string') return { type: rawType, nullable: Boolean(schema.nullable) };
  if (schema.properties) return { type: 'object', nullable: Boolean(schema.nullable) };
  return { type: 'unknown', nullable: Boolean(schema.nullable) };
}

function buildNode(name: string, rawSchema: JSONSchemaLike | undefined, required: boolean, depth: number): SchemaTreeNode {
  const { schema } = resolveUnion(rawSchema);
  if (!schema) return { name, type: 'unknown', required, nullable: false };

  const { type, nullable } = resolveType(schema);

  if (type === 'array') {
    const { schema: itemSchema } = resolveUnion(schema.items as JSONSchemaLike | undefined);
    const itemIsObject = Boolean(itemSchema && (itemSchema.type === 'object' || itemSchema.properties));
    return {
      name: `${name}[]`,
      type: 'array',
      required,
      nullable,
      children: itemIsObject ? schemaToTreeNodes(itemSchema, depth + 1) : undefined,
    };
  }

  if (type === 'object') {
    return { name, type: 'object', required, nullable, children: schemaToTreeNodes(schema, depth + 1) };
  }

  return { name, type, required, nullable };
}

/**
 * Builds a navigable tree of a JSON Schema's properties — used by the
 * SchemaTree component. Distinct from `buildSchemaExample()`: this walks
 * schema METADATA (name/type/required/nullable), not example values.
 */
export function schemaToTreeNodes(schema: JSONSchemaLike | undefined, depth = 0): SchemaTreeNode[] {
  if (!schema || depth > 12) return [];

  const { schema: resolved } = resolveUnion(schema);
  if (!resolved) return [];

  const required = new Set((resolved.required as string[] | undefined) ?? []);
  const properties = (resolved.properties as Record<string, JSONSchemaLike>) ?? {};

  return Object.entries(properties).map(([name, propSchema]) =>
    buildNode(name, propSchema, required.has(name), depth),
  );
}
