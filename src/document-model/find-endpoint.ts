import type { Endpoint, TagGroup } from './types';

/**
 * Exact match only (method case-insensitive, path as-is — including `{param}` templates).
 * No fuzzy/guessing: a guide author writes the literal path from the spec, same convention
 * as patch-spec's "don't guess" rule for non-literal decorator args.
 */
export function findEndpoint(tagGroups: TagGroup[], method: string, path: string): Endpoint | undefined {
  const normalizedMethod = method.toUpperCase();
  for (const group of tagGroups) {
    const match = group.endpoints.find((e) => e.method.toUpperCase() === normalizedMethod && e.path === path);
    if (match) return match;
  }
  return undefined;
}
