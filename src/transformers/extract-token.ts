import type { SecuritySchemeInfo } from '../document-model/types';

const TOKEN_KEY_PATTERN = /^(access_?token|id_?token|token|jwt|bearer_?token)$/i;
const MAX_SEARCH_DEPTH = 3;

/**
 * Looks for a plausible auth token in a JSON response body — e.g. a login endpoint's
 * `{ data: { access_token: "..." } }` — by walking object keys (not arrays) up to a shallow
 * depth and matching common token field name conventions. Returns the first match found in
 * breadth-first order, so a top-level `token` wins over one nested inside `data`.
 */
export function findLikelyToken(bodyText: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return undefined;
  }

  let queue: unknown[] = [parsed];
  for (let depth = 0; depth < MAX_SEARCH_DEPTH && queue.length > 0; depth++) {
    const next: unknown[] = [];
    for (const node of queue) {
      if (typeof node !== 'object' || node === null || Array.isArray(node)) continue;
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && value.length > 0 && TOKEN_KEY_PATTERN.test(key)) return value;
      }
      next.push(...Object.values(node));
    }
    queue = next;
  }
  return undefined;
}

/** First scheme suited to "paste a bearer token" — http bearer, then oauth2/openIdConnect
 * (which this app already treats as bearer-token-paste, see execute-request.ts `applyAuth`). */
export function findBearerSchemeName(securitySchemes: Record<string, SecuritySchemeInfo>): string | undefined {
  const entries = Object.entries(securitySchemes);
  const httpBearer = entries.find(([, s]) => s.type === 'http' && s.scheme === 'bearer');
  if (httpBearer) return httpBearer[0];
  const tokenBased = entries.find(([, s]) => s.type === 'oauth2' || s.type === 'openIdConnect');
  return tokenBased?.[0];
}
