import type { Endpoint, ParameterInfo } from '../document-model/types';
import { buildSchemaExample } from '../document-model/example';

export type SnippetLang = 'curl' | 'javascript' | 'axios' | 'python' | 'php';

export const SNIPPET_LANGUAGES: { id: SnippetLang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'javascript', label: 'JavaScript (fetch)' },
  { id: 'axios', label: 'Axios' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
];

function paramTypeToken(param: ParameterInfo): string {
  return typeof param.schema?.type === 'string' ? (param.schema!.type as string) : 'value';
}

/** Builds the request URL with query parameters rendered as `name=type` placeholders, never fake values. */
export function buildSnippetUrl(endpoint: Endpoint, baseUrl: string): string {
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  const query = queryParams.length > 0
    ? `?${queryParams.map((p) => `${p.name}=${paramTypeToken(p)}`).join('&')}`
    : '';
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}${endpoint.path}${query}`;
}

function getBodyJson(endpoint: Endpoint): string | undefined {
  if (!endpoint.requestBody?.schema) return undefined;
  return buildSchemaExample(endpoint.requestBody.schema)?.json;
}

function curlSnippet(endpoint: Endpoint, url: string, bodyJson: string | undefined): string {
  const lines = [`curl -X ${endpoint.method} '${url}'`];
  if (bodyJson) {
    lines[0] += ' \\';
    lines.push(`  -H 'Content-Type: application/json' \\`);
    lines.push(`  -d '${bodyJson}'`);
  }
  return lines.join('\n');
}

function fetchSnippet(endpoint: Endpoint, url: string, bodyJson: string | undefined): string {
  const lines = [`fetch('${url}', {`, `  method: '${endpoint.method}',`];
  if (bodyJson) {
    lines.push(`  headers: { 'Content-Type': 'application/json' },`);
    lines.push(`  body: JSON.stringify(${bodyJson}),`);
  }
  lines.push(`})`, `  .then((res) => res.json())`, `  .then((data) => console.log(data));`);
  return lines.join('\n');
}

function axiosSnippet(endpoint: Endpoint, url: string, bodyJson: string | undefined): string {
  const method = endpoint.method.toLowerCase();
  return bodyJson ? `axios.${method}('${url}', ${bodyJson});` : `axios.${method}('${url}');`;
}

function pythonSnippet(endpoint: Endpoint, url: string, bodyJson: string | undefined): string {
  // Our generated bodyJson is always double-quoted-string-valued (type tokens,
  // never numbers/booleans/null) — valid Python dict literal syntax as-is.
  const method = endpoint.method.toLowerCase();
  const lines = ['import requests', ''];
  lines.push(bodyJson ? `response = requests.${method}('${url}', json=${bodyJson})` : `response = requests.${method}('${url}')`);
  lines.push('print(response.json())');
  return lines.join('\n');
}

function phpSnippet(endpoint: Endpoint, url: string, bodyJson: string | undefined): string {
  const lines = [
    '<?php',
    `$ch = curl_init('${url}');`,
    'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);',
    `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${endpoint.method}');`,
  ];
  if (bodyJson) {
    lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${bodyJson}');`);
    lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);`);
  }
  lines.push('$response = curl_exec($ch);', 'curl_close($ch);', 'echo $response;');
  return lines.join('\n');
}

const GENERATORS: Record<SnippetLang, (endpoint: Endpoint, url: string, bodyJson: string | undefined) => string> = {
  curl: curlSnippet,
  javascript: fetchSnippet,
  axios: axiosSnippet,
  python: pythonSnippet,
  php: phpSnippet,
};

/**
 * Generates a runnable code snippet for an endpoint in the given language.
 * Request bodies use the same type-token example as Copy for AI (no fake
 * data) — see `buildSchemaExample()`. Pure, no I/O.
 */
export function buildCodeSnippet(endpoint: Endpoint, baseUrl: string, lang: SnippetLang): string {
  const url = buildSnippetUrl(endpoint, baseUrl);
  const bodyJson = getBodyJson(endpoint);
  return GENERATORS[lang](endpoint, url, bodyJson);
}
