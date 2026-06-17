import type { JSONSchemaLike } from './types';
import { resolveUnion } from './example';

export interface SchemaTreeNode {
  /** Property name, or `name[]` for arrays. */
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  /** True when this node's schema is an ancestor of itself (recursive DTO) — `children` is omitted instead of expanding again. */
  circular?: boolean;
  children?: SchemaTreeNode[];
}

const MAX_DEPTH = 20;

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

/**
 * `ancestors` tracks resolved OBJECT schemas on the current recursion path
 * by identity — keyed on the object schema itself (e.g. `Category`), not
 * on any array wrapper around it, so that two different array properties
 * pointing at the same recursive type (`children: Category[]` and
 * `related: Category[]`) are both caught on their first repeat, not just
 * the one visited twice.
 */
function buildNode(
  name: string,
  rawSchema: JSONSchemaLike | undefined,
  required: boolean,
  depth: number,
  ancestors: Set<JSONSchemaLike>,
): SchemaTreeNode {
  const { schema } = resolveUnion(rawSchema);
  if (!schema) return { name, type: 'unknown', required, nullable: false };

  const { type, nullable } = resolveType(schema);

  if (type === 'array') {
    const { schema: itemSchema } = resolveUnion(schema.items as JSONSchemaLike | undefined);
    const itemIsObject = Boolean(itemSchema && (itemSchema.type === 'object' || itemSchema.properties));

    if (!itemIsObject) {
      return { name: `${name}[]`, type: 'array', required, nullable };
    }
    if (ancestors.has(itemSchema!)) {
      return { name: `${name}[]`, type: 'array', required, nullable, circular: true };
    }

    ancestors.add(itemSchema!);
    const children = schemaToTreeNodes(itemSchema, depth + 1, ancestors);
    ancestors.delete(itemSchema!);
    return { name: `${name}[]`, type: 'array', required, nullable, children };
  }

  if (type === 'object') {
    if (ancestors.has(schema)) {
      return { name, type: 'object', required, nullable, circular: true };
    }

    ancestors.add(schema);
    const children = schemaToTreeNodes(schema, depth + 1, ancestors);
    ancestors.delete(schema);
    return { name, type: 'object', required, nullable, children };
  }

  return { name, type, required, nullable };
}

/**
 * Builds a navigable tree of a JSON Schema's properties — used by the
 * SchemaTree component. Distinct from `buildSchemaExample()`: this walks
 * schema METADATA (name/type/required/nullable), not example values.
 *
 * Cycle-safe: a recursive DTO (`User.parent: User`) dereferences into a
 * real object cycle, not just a `$ref` string. A depth cap alone would
 * unroll the same shape repeatedly; tracking ancestors by identity stops
 * at the node where the cycle closes (`circular: true`, no children).
 *
 * Note: the root schema itself isn't pre-added to `ancestors`, so a
 * direct self-reference shows the recursive property's shape ONE level
 * deep before flagging the next repeat as circular (e.g. `parent` shows
 * its own `id`, and `parent`'s `parent` is the one marked circular) —
 * more useful for a human exploring the tree than cutting at zero depth.
 * `buildSchemaExample()` in example.ts deliberately cuts immediately
 * instead, since that output is meant to be as compact as possible.
 */
export function schemaToTreeNodes(
  schema: JSONSchemaLike | undefined,
  depth = 0,
  ancestors: Set<JSONSchemaLike> = new Set(),
): SchemaTreeNode[] {
  if (!schema || depth > MAX_DEPTH) return [];

  const { schema: resolved } = resolveUnion(schema);
  if (!resolved) return [];

  const required = new Set((resolved.required as string[] | undefined) ?? []);
  const properties = (resolved.properties as Record<string, JSONSchemaLike>) ?? {};

  return Object.entries(properties).map(([name, propSchema]) =>
    buildNode(name, propSchema, required.has(name), depth, ancestors),
  );
}
