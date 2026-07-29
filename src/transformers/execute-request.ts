import type { Endpoint, SecuritySchemeInfo } from '../document-model/types';
import type { TryItResult } from '../state/try-it-store';

const NETWORK_ERROR_MESSAGE =
  'Request failed to reach the server. This usually means the API does not allow requests from this origin (CORS), or the server is unreachable.';

const PROXY_ERROR_HEADER = 'x-docfy-proxy-error';

/** `window.__DOCFY_PROXY_PATH__` injected by `DocfyUiModule.setup({ openApiDocument })` — same
 * pattern as `getConfiguredSpecs()` in `state/spec-store.ts`, just read fresh per request instead
 * of cached, since it never changes after the page loads. */
export function getConfiguredProxyPath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.__DOCFY_PROXY_PATH__;
}

/** Substitutes `{param}` path tokens and appends filled query params. Path/query params not present in `paramValues` are skipped. */
export function buildRequestUrl(endpoint: Endpoint, baseUrl: string, paramValues: Record<string, string>): string {
  let path = endpoint.path;
  for (const param of endpoint.parameters.filter((p) => p.in === 'path')) {
    const value = paramValues[param.name];
    if (value !== undefined && value !== '') {
      path = path.replace(`{${param.name}}`, encodeURIComponent(value));
    }
  }

  const query = new URLSearchParams();
  for (const param of endpoint.parameters.filter((p) => p.in === 'query')) {
    const value = paramValues[param.name];
    if (value !== undefined && value !== '') query.set(param.name, value);
  }

  const base = baseUrl.replace(/\/+$/, '');
  const queryString = query.toString();
  return `${base}${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Applies auth for the first satisfiable alternative in `security` that has a value in
 * `authValues` — OpenAPI alternatives are OR, so the first one the user filled in wins.
 * `apiKey` goes to header or query per its `in`; `cookie` is skipped (can't be set reliably
 * cross-site from the browser). `http bearer`/`oauth2`/`openIdConnect` all take a raw token
 * pasted by the user (no OAuth dance performed). `http basic` expects `user:pass`.
 */
export function applyAuth(
  url: string,
  headers: Headers,
  security: Record<string, string[]>[],
  securitySchemes: Record<string, SecuritySchemeInfo>,
  authValues: Record<string, string>,
): string {
  const alternative = security.find((req) => Object.keys(req).every((name) => Boolean(authValues[name])));
  if (!alternative) return url;

  let finalUrl = url;
  for (const schemeName of Object.keys(alternative)) {
    const scheme = securitySchemes[schemeName];
    const value = authValues[schemeName];
    if (!scheme || !value) continue;

    if (scheme.type === 'apiKey') {
      if (scheme.in === 'header' && scheme.name) {
        headers.set(scheme.name, value);
      } else if (scheme.in === 'query' && scheme.name) {
        const parsed = new URL(finalUrl);
        parsed.searchParams.set(scheme.name, value);
        finalUrl = parsed.toString();
      }
      // `in === 'cookie'` intentionally unsupported.
      continue;
    }

    if (scheme.type === 'http' && scheme.scheme === 'basic') {
      headers.set('Authorization', `Basic ${btoa(value)}`);
      continue;
    }

    // http bearer, oauth2, openIdConnect — all treated as "paste a bearer token".
    headers.set('Authorization', `Bearer ${value}`);
  }
  return finalUrl;
}

export interface ExecuteRequestOptions {
  baseUrl: string;
  paramValues: Record<string, string>;
  bodyText: string | undefined;
  authValues: Record<string, string>;
  securitySchemes: Record<string, SecuritySchemeInfo>;
}

export async function executeRequest(endpoint: Endpoint, options: ExecuteRequestOptions): Promise<TryItResult> {
  const headers = new Headers();
  for (const param of endpoint.parameters.filter((p) => p.in === 'header')) {
    const value = options.paramValues[param.name];
    if (value !== undefined && value !== '') headers.set(param.name, value);
  }

  const hasBody = endpoint.requestBody && options.bodyText !== undefined && options.bodyText.trim() !== '';
  if (hasBody) headers.set('Content-Type', endpoint.requestBody!.contentType);

  const rawUrl = buildRequestUrl(endpoint, options.baseUrl, options.paramValues);
  const url = applyAuth(rawUrl, headers, endpoint.security, options.securitySchemes, options.authValues);
  const requestBody = hasBody ? options.bodyText : undefined;

  const proxyPath = getConfiguredProxyPath();
  const started = performance.now();
  try {
    const response = proxyPath
      ? await fetch(proxyPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: endpoint.method, url, headers: Object.fromEntries(headers), body: requestBody }),
        })
      : await fetch(url, { method: endpoint.method, headers, body: requestBody });
    const durationMs = performance.now() - started;

    // Only the proxy's own failures (bad request / disallowed origin / unreachable target)
    // set this header — a real response from the target, even a 4xx/5xx, never does.
    const proxyError = response.headers.get(PROXY_ERROR_HEADER);
    if (proxyError) {
      const errorBody = await response.json().catch(() => undefined);
      return { kind: 'network-error', message: errorBody?.message ?? `Proxy error: ${proxyError}` };
    }

    const bodyText = await response.text();
    return {
      kind: 'success',
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()),
      bodyText,
      durationMs,
    };
  } catch {
    // fetch only rejects with a TypeError for network/CORS failures — never for HTTP error statuses.
    return { kind: 'network-error', message: NETWORK_ERROR_MESSAGE };
  }
}
