import { describe, it, expect } from 'vitest';
import { filterTagGroups } from './filter';
import type { Endpoint, TagGroup } from './types';

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/users',
    operationId: 'findAllUsers',
    summary: 'List all users',
    description: undefined,
    tags: ['users'],
    parameters: [],
    requestBody: undefined,
    responses: [],
    ...overrides,
  };
}

function makeGroup(name: string, endpoints: Endpoint[]): TagGroup {
  return { name, description: undefined, endpoints };
}

describe('filterTagGroups()', () => {
  it('returns groups unchanged for an empty query', () => {
    const groups = [makeGroup('users', [makeEndpoint()])];
    expect(filterTagGroups(groups, '')).toEqual(groups);
  });

  it('returns groups unchanged for a whitespace-only query', () => {
    const groups = [makeGroup('users', [makeEndpoint()])];
    expect(filterTagGroups(groups, '   ')).toEqual(groups);
  });

  it('matches by substring in path', () => {
    const groups = [makeGroup('users', [makeEndpoint({ path: '/users/{id}' })])];
    expect(filterTagGroups(groups, 'users')[0].endpoints).toHaveLength(1);
    expect(filterTagGroups(groups, 'orders')).toHaveLength(0);
  });

  it('matches by substring in summary, case-insensitively', () => {
    const groups = [makeGroup('users', [makeEndpoint({ summary: 'List all users' })])];
    expect(filterTagGroups(groups, 'LIST')[0].endpoints).toHaveLength(1);
  });

  it('matches by substring in operationId', () => {
    const groups = [makeGroup('users', [makeEndpoint({ operationId: 'createUser' })])];
    expect(filterTagGroups(groups, 'createuser')[0].endpoints).toHaveLength(1);
  });

  it('drops a tag group entirely when none of its endpoints match', () => {
    const groups = [
      makeGroup('users', [makeEndpoint({ path: '/users', summary: 'List users', operationId: 'findAllUsers' })]),
      makeGroup('orders', [makeEndpoint({ path: '/orders', summary: 'List orders', operationId: 'findAllOrders' })]),
    ];
    const result = filterTagGroups(groups, 'users');
    expect(result.map((g) => g.name)).toEqual(['users']);
  });

  it('keeps only the matching endpoints within a group, not the whole group', () => {
    const groups = [
      makeGroup('users', [
        makeEndpoint({ path: '/users', operationId: 'findAll' }),
        makeEndpoint({ path: '/users/{id}', operationId: 'findOne' }),
      ]),
    ];
    const result = filterTagGroups(groups, 'findOne');
    expect(result[0].endpoints).toHaveLength(1);
    expect(result[0].endpoints[0].operationId).toBe('findOne');
  });

  it('handles endpoints with no summary/operationId without throwing', () => {
    const groups = [makeGroup('users', [makeEndpoint({ summary: undefined, operationId: undefined })])];
    expect(() => filterTagGroups(groups, 'users')).not.toThrow();
  });
});
