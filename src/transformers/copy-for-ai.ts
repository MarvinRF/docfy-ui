import type { Endpoint, JSONSchemaLike, ParameterInfo, ResponseInfo } from '../document-model/types';
import { capDepth } from '../document-model/cap-depth';

const STATUS_TEXT: Record<string, string> = {
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

function truncateToSentences(text: string, maxSentences: number): string {
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(' ');
}

function buildPurpose(endpoint: Endpoint): string | undefined {
  if (endpoint.summary) return endpoint.summary;
  if (endpoint.description) return truncateToSentences(endpoint.description, 2);
  return undefined;
}

/** Resolves `oneOf`/`anyOf` to its first variant. Returns the variant count when a union was found. */
function resolveUnion(schema: JSONSchemaLike | undefined): { schema: JSONSchemaLike | undefined; unionSize?: number } {
  if (!schema) return { schema: undefined };
  const union = (schema.oneOf as JSONSchemaLike[] | undefined) ?? (schema.anyOf as JSONSchemaLike[] | undefined);
  if (union && union.length > 0) return { schema: union[0], unionSize: union.length };
  return { schema };
}

/**
 * Flattens a JSON Schema into an example using TYPE NAMES as values
 * ("name": "string"), never fake data — per spec section 3.2 step 3
 * ("chave: tipo, não valores fake").
 *
 * Deliberate deviation from the worked example in section 3.3: that
 * example renders `"id": "uuid"` (using `format` instead of `type`) for
 * the response but `"email": "string"` (using `type`, ignoring its
 * `format: email`) for the request — an internal inconsistency, since
 * both are string-typed properties with a format. We follow the
 * algorithm's own stated rule (type, not format) for both sections, for
 * one consistent, predictable output. Format-specific detail (email,
 * uuid, date-time, ...) is surfaced in the Validation section instead.
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

interface SchemaSectionResult {
  json: string;
  unionSizes: number[];
}

function buildSchemaSection(schema: JSONSchemaLike | undefined): SchemaSectionResult | undefined {
  if (!schema) return undefined;
  const unionSizes: number[] = [];
  const example = flattenSchema(schema, 0, unionSizes);
  const safe = capDepth(example, { maxDepth: 12 });
  return { json: JSON.stringify(safe, null, 2), unionSizes };
}

function withUnionNotes(body: string, unionSizes: number[]): string {
  if (unionSizes.length === 0) return body;
  const notes = unionSizes.map((n) => `(one of ${n} possible shapes)`);
  return `${body}\n${notes.join('\n')}`;
}

/**
 * Extracts explicit validation rules from a request body schema:
 * format, minLength/maxLength, minimum/maximum, pattern, enum.
 *
 * Deliberate decision: `required` does NOT produce its own line. The
 * worked example in section 3.3 shows zero "X is required" lines for a
 * register endpoint where email/password are almost certainly required —
 * presence is already conveyed by the field simply appearing in the
 * Request example, so a separate "required" line would be redundant
 * noise for the AI consumer. Reproduced exactly against that example.
 */
function extractValidationRules(schema: JSONSchemaLike | undefined, prefix = ''): string[] {
  const { schema: resolved } = resolveUnion(schema);
  if (!resolved) return [];

  const properties = (resolved.properties as Record<string, JSONSchemaLike>) ?? {};
  const rules: string[] = [];

  for (const [key, rawPropSchema] of Object.entries(properties)) {
    const name = prefix ? `${prefix}.${key}` : key;
    const { schema: prop } = resolveUnion(rawPropSchema);
    if (!prop) continue;

    if (prop.format) rules.push(`${name} must be valid`);
    if (prop.minLength !== undefined) rules.push(`${name} min length ${prop.minLength}`);
    if (prop.maxLength !== undefined) rules.push(`${name} max length ${prop.maxLength}`);
    if (prop.minimum !== undefined) rules.push(`${name} min ${prop.minimum}`);
    if (prop.maximum !== undefined) rules.push(`${name} max ${prop.maximum}`);
    if (prop.pattern) rules.push(`${name} must match pattern ${prop.pattern}`);
    if (Array.isArray(prop.enum)) rules.push(`${name} must be one of: ${(prop.enum as unknown[]).join(', ')}`);

    if (prop.type === 'object' && prop.properties) {
      rules.push(...extractValidationRules(prop, name));
    }
  }

  return rules;
}

function formatParameterLine(param: ParameterInfo): string {
  const required = param.required ? ', required' : '';
  const type = typeof param.schema?.type === 'string' ? (param.schema!.type as string) : 'unknown';
  const description = param.description ? ` — ${param.description}` : '';
  return `- ${param.name} (${param.in}${required}): ${type}${description}`;
}

/**
 * Primary 2xx response: smallest numeric 2xx code declared. Non-numeric
 * statuses (e.g. "default") are not considered — out of scope per spec.
 */
function pickPrimarySuccessResponse(responses: ResponseInfo[]): ResponseInfo | undefined {
  const numeric2xx = responses
    .filter((r) => /^2\d\d$/.test(r.status))
    .sort((a, b) => Number(a.status) - Number(b.status));
  return numeric2xx[0];
}

function buildErrorResponseLines(responses: ResponseInfo[]): string[] {
  return responses
    .filter((r) => /^[45]\d\d$/.test(r.status))
    .map((r) => `${r.status} ${r.description ?? STATUS_TEXT[r.status] ?? ''}`.trim());
}

/**
 * Transforms a normalized Endpoint into the plain-text, LLM-ready
 * representation behind the "Copy for AI" button. Pure function, no I/O —
 * runs entirely client-side in well under 5ms.
 *
 * Section order: Endpoint → Purpose → Request → Parameters → Validation →
 * Success Response → Error Responses. Empty sections are omitted.
 *
 * Note: the worked example in the spec (section 3.3) shows sections
 * joined with a single newline, not a blank line, despite step 7's prose
 * saying "uma linha em branco entre seções" — we match the example
 * literally, since that's what's testable/verifiable.
 */
export function operationToAiText(endpoint: Endpoint): string {
  const sections: string[] = [];

  sections.push(`Endpoint: ${endpoint.method} ${endpoint.path}`);

  const purpose = buildPurpose(endpoint);
  if (purpose) sections.push(`Purpose:\n${purpose}`);

  if (endpoint.requestBody?.schema) {
    const result = buildSchemaSection(endpoint.requestBody.schema);
    if (result) sections.push(withUnionNotes(`Request:\n${result.json}`, result.unionSizes));
  }

  const listableParams = endpoint.parameters.filter((p) => p.in !== 'cookie');
  if (listableParams.length > 0) {
    sections.push(`Parameters:\n${listableParams.map(formatParameterLine).join('\n')}`);
  }

  if (endpoint.requestBody?.schema) {
    const rules = extractValidationRules(endpoint.requestBody.schema);
    if (rules.length > 0) {
      sections.push(`Validation:\n${rules.map((r) => `- ${r}`).join('\n')}`);
    }
  }

  const success = pickPrimarySuccessResponse(endpoint.responses);
  if (success) {
    const result = buildSchemaSection(success.schema);
    const body = result ? withUnionNotes(result.json, result.unionSizes) : (success.description ?? 'No content');
    sections.push(`Success Response (${success.status}):\n${body}`);
  }

  const errorLines = buildErrorResponseLines(endpoint.responses);
  if (errorLines.length > 0) {
    sections.push(`Error Responses:\n${errorLines.join('\n')}`);
  }

  return sections.join('\n');
}
