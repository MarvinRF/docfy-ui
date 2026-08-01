import { describe, it, expect } from 'vitest';
import { findEndpoint } from './find-endpoint';
import type { Endpoint, TagGroup } from './types';

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/users/{id}',
    operationId: 'getUser',
    summary: 'Get user',
    description: '',
    tags: ['users'],
    parameters: [],
    requestBody: undefined,
    responses: [],
    security: [],
    ...overrides,
  };
}

describe('findEndpoint', () => {
  const tagGroups: TagGroup[] = [
    { name: 'users', description: undefined, endpoints: [makeEndpoint()] },
    {
      name: 'auth',
      description: undefined,
      endpoints: [makeEndpoint({ method: 'POST', path: '/auth/login', operationId: 'login' })],
    },
  ];

  it('finds an endpoint by exact method + path across tag groups', () => {
    expect(findEndpoint(tagGroups, 'POST', '/auth/login')?.operationId).toBe('login');
  });

  it('matches method case-insensitively', () => {
    expect(findEndpoint(tagGroups, 'get', '/users/{id}')?.operationId).toBe('getUser');
  });

  it('does not fuzzy-match paths — a mismatched template segment is a miss', () => {
    expect(findEndpoint(tagGroups, 'GET', '/users/123')).toBeUndefined();
  });

  it('returns undefined when no endpoint matches', () => {
    expect(findEndpoint(tagGroups, 'DELETE', '/users/{id}')).toBeUndefined();
  });
});
