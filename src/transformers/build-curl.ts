import type { Endpoint, SecuritySchemeInfo } from '../document-model/types';
import { applyAuth, buildRequestUrl } from './execute-request';

export interface BuildCurlOptions {
  baseUrl: string;
  paramValues: Record<string, string>;
  bodyText: string | undefined;
  authValues: Record<string, string>;
  securitySchemes: Record<string, SecuritySchemeInfo>;
}

/** Escapes a value for safe placement inside single quotes in a POSIX shell command. */
function shQuote(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

/**
 * Reproduces, as a runnable `curl` command, the exact request "Try it out" would send right
 * now — real filled-in path/query/header param values and resolved auth (not the placeholder
 * `name=type` tokens the static "Code" tab snippets use, which never see auth or user input).
 * Shares `buildRequestUrl()`/`applyAuth()` with `executeRequest()` so the two can never drift
 * apart on how a request is actually built.
 */
export function buildCurlCommand(endpoint: Endpoint, options: BuildCurlOptions): string {
  const headers = new Headers();
  for (const param of endpoint.parameters.filter((p) => p.in === 'header')) {
    const value = options.paramValues[param.name];
    if (value !== undefined && value !== '') headers.set(param.name, value);
  }

  const hasBody = Boolean(endpoint.requestBody) && options.bodyText !== undefined && options.bodyText.trim() !== '';
  if (hasBody) headers.set('Content-Type', endpoint.requestBody!.contentType);

  const rawUrl = buildRequestUrl(endpoint, options.baseUrl, options.paramValues);
  const url = applyAuth(rawUrl, headers, endpoint.security, options.securitySchemes, options.authValues);

  const parts = [`curl -X ${endpoint.method} '${shQuote(url)}'`];
  for (const [name, value] of headers.entries()) {
    parts.push(`-H '${shQuote(name)}: ${shQuote(value)}'`);
  }
  if (hasBody) parts.push(`-d '${shQuote(options.bodyText!)}'`);

  return parts.join(' \\\n  ');
}
