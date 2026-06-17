import type { Endpoint, JSONSchemaLike, ParameterInfo } from '../document-model/types';
import {
  STATUS_TEXT,
  buildSchemaExample,
  pickPrimarySuccessResponse,
  resolveUnion,
  withUnionNotes,
} from '../document-model/example';

function truncateToSentences(text: string, maxSentences: number): string {
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(' ');
}

function buildPurpose(endpoint: Endpoint): string | undefined {
  if (endpoint.summary) return endpoint.summary;
  if (endpoint.description) return truncateToSentences(endpoint.description, 2);
  return undefined;
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
 *
 * `depth` caps recursion into nested objects — dereferenced schemas can
 * be real object cycles (recursive DTOs), same hazard `capDepth()` guards
 * against elsewhere. Without this cap, a recursive DTO crashes the
 * browser tab with a stack overflow on every "Copy for AI" click.
 */
function extractValidationRules(schema: JSONSchemaLike | undefined, prefix = '', depth = 0): string[] {
  if (depth > 10) return [];

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
      rules.push(...extractValidationRules(prop, name, depth + 1));
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

function buildErrorResponseLines(responses: Endpoint['responses']): string[] {
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
    const result = buildSchemaExample(endpoint.requestBody.schema);
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
    const result = buildSchemaExample(success.schema);
    const body = result ? withUnionNotes(result.json, result.unionSizes) : (success.description ?? 'No content');
    sections.push(`Success Response (${success.status}):\n${body}`);
  }

  const errorLines = buildErrorResponseLines(endpoint.responses);
  if (errorLines.length > 0) {
    sections.push(`Error Responses:\n${errorLines.join('\n')}`);
  }

  return sections.join('\n');
}
