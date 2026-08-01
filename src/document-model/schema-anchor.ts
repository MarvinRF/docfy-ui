export interface SchemaAnchor {
  scope: string;
  path: string[];
}

/**
 * Builds the URL hash for a deep link into a nested schema property, e.g.
 * `#response-200/address/city`. `scope` is `response-<status>` or
 * `request-body`; `path` is the raw property-key chain from the schema root.
 */
export function buildSchemaAnchorHash(scope: string, path: string[]): string {
  return `#${[scope, ...path].map(encodeURIComponent).join('/')}`;
}

/**
 * Parses a `window.location.hash`-style string (with or without the leading
 * `#`) back into a scope + path. Returns null for anything that isn't a
 * well-formed schema anchor (empty hash, no scope segment).
 */
export function parseSchemaAnchorHash(hash: string): SchemaAnchor | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;

  const segments = raw.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments.length === 0) return null;

  const [scope, ...path] = segments;
  return { scope, path };
}

/**
 * DOM id for the row representing this schema node — used to scroll to and
 * highlight the target of a deep link. Collisions are theoretically possible
 * for property names containing `-`, but not worth guarding against for a
 * scroll-target id (not a styling/selection hook used elsewhere).
 */
export function buildSchemaAnchorId(scope: string, path: string[]): string {
  return `schema-anchor-${scope}-${path.join('-')}`;
}
