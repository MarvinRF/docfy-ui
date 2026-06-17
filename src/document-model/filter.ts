import type { TagGroup } from './types';

/**
 * Filters tag groups by a case-insensitive substring match against
 * `path`, `summary`, or `operationId`. Empty query returns the groups
 * unchanged. Tag groups left with zero matching endpoints are dropped.
 */
export function filterTagGroups(tagGroups: TagGroup[], query: string): TagGroup[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === '') return tagGroups;

  return tagGroups
    .map((group) => ({
      ...group,
      endpoints: group.endpoints.filter((endpoint) => {
        const haystack = [endpoint.path, endpoint.summary, endpoint.operationId]
          .filter((v): v is string => Boolean(v))
          .join(' ')
          .toLowerCase();
        return haystack.includes(trimmed);
      }),
    }))
    .filter((group) => group.endpoints.length > 0);
}
