import type { JSONSchemaLike, ResponseInfo } from './types';
import { capDepth } from './cap-depth';

export const STATUS_TEXT: Record<string, string> = {
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '409': 'Conflict',
  '422': 'Unprocessable Entity',
  '429': 'Too Many Requests',
  '500': 'Internal Server Error',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
};

/** Resolves `oneOf`/`anyOf` to its first variant. Returns the variant count when a union was found. */
export function resolveUnion(schema: JSONSchemaLike | undefined): { schema: JSONSchemaLike | undefined; unionSize?: number } {
  if (!schema) return { schema: undefined };
  const union = (schema.oneOf as JSONSchemaLike[] | undefined) ?? (schema.anyOf as JSONSchemaLike[] | undefined);
  if (union && union.length > 0) return { schema: union[0], unionSize: union.length };
  return { schema };
}

/**
 * Flattens a JSON Schema into an example using TYPE NAMES as values
 * ("name": "string"), never fake data — per the Copy for AI spec, section
 * 3.2 step 3 ("chave: tipo, não valores fake"). Shared between the Copy
 * for AI transformer and the code snippet generators so both render the
 * exact same request/response body shape.
 */
function flattenSchema(schema: JSONSchemaLike | undefined, depth: number, unionSizes: number[]): unknown {
  if (!schema || depth > 10) return 'object';

  const { schema: resolved, unionSize } = resolveUnion(schema);
  if (unionSize) unionSizes.push(unionSize);
  if (!resolved) return 'object';

  const rawType = resolved.type;
  const type = Array.isArray(rawType) ? (rawType as string[]).find((t) => t !== 'null') ?? rawType[0] : rawType;

  if (type === 'object' || resolved.properties) {
    const props = (resolved.properties as Record<string, JSONSchemaLike>) ?? {};
    const out: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(props)) {
      out[key] = flattenSchema(propSchema, depth + 1, unionSizes);
    }
    return out;
  }

  if (type === 'array') {
    return [flattenSchema(resolved.items as JSONSchemaLike | undefined, depth + 1, unionSizes)];
  }

  if (typeof type === 'string') return type;
  return 'object';
}

export interface SchemaExampleResult {
  /** The flattened example, JSON.stringify-safe (cycles already capped). */
  example: unknown;
  json: string;
  unionSizes: number[];
}

export function buildSchemaExample(schema: JSONSchemaLike | undefined): SchemaExampleResult | undefined {
  if (!schema) return undefined;
  const unionSizes: number[] = [];
  const example = flattenSchema(schema, 0, unionSizes);
  const safe = capDepth(example, { maxDepth: 12 });
  return { example: safe, json: JSON.stringify(safe, null, 2), unionSizes };
}

export function withUnionNotes(body: string, unionSizes: number[]): string {
  if (unionSizes.length === 0) return body;
  const notes = unionSizes.map((n) => `(one of ${n} possible shapes)`);
  return `${body}\n${notes.join('\n')}`;
}

/**
 * Primary 2xx response: smallest numeric 2xx code declared. Non-numeric
 * statuses (e.g. "default") are not considered.
 */
export function pickPrimarySuccessResponse(responses: ResponseInfo[]): ResponseInfo | undefined {
  const numeric2xx = responses
    .filter((r) => /^2\d\d$/.test(r.status))
    .sort((a, b) => Number(a.status) - Number(b.status));
  return numeric2xx[0];
}
