import { describe, it, expect } from 'vitest';
import type { SecuritySchemeInfo } from '../document-model/types';
import { findLikelyToken, findBearerSchemeName } from './extract-token';

describe('findLikelyToken()', () => {
  it('finds a top-level access_token', () => {
    expect(findLikelyToken('{"access_token":"abc123"}')).toBe('abc123');
  });

  it('finds a nested access_token (e.g. wrapped in a "data" envelope)', () => {
    expect(findLikelyToken('{"success":true,"data":{"access_token":"nested-token","user":{"id":"1"}}}')).toBe(
      'nested-token',
    );
  });

  it('matches common naming variants case-insensitively', () => {
    expect(findLikelyToken('{"Token":"x"}')).toBe('x');
    expect(findLikelyToken('{"idToken":"y"}')).toBe('y');
    expect(findLikelyToken('{"JWT":"z"}')).toBe('z');
  });

  it('prefers a shallower match over a deeper one', () => {
    expect(findLikelyToken('{"token":"shallow","data":{"nested":{"token":"deep"}}}')).toBe('shallow');
  });

  it('does not descend into arrays', () => {
    expect(findLikelyToken('{"items":[{"token":"in-array"}]}')).toBeUndefined();
  });

  it('gives up beyond the search depth limit', () => {
    expect(findLikelyToken('{"a":{"b":{"c":{"token":"too-deep"}}}}')).toBeUndefined();
  });

  it('returns undefined for a non-JSON body', () => {
    expect(findLikelyToken('not json')).toBeUndefined();
  });

  it('returns undefined when no token-shaped field exists', () => {
    expect(findLikelyToken('{"id":"1","name":"Ada"}')).toBeUndefined();
  });
});

describe('findBearerSchemeName()', () => {
  const bearer: SecuritySchemeInfo = {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    in: undefined,
    name: undefined,
    description: undefined,
  };
  const basic: SecuritySchemeInfo = {
    type: 'http',
    scheme: 'basic',
    bearerFormat: undefined,
    in: undefined,
    name: undefined,
    description: undefined,
  };
  const apiKey: SecuritySchemeInfo = {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    scheme: undefined,
    bearerFormat: undefined,
    description: undefined,
  };
  const oauth2: SecuritySchemeInfo = {
    type: 'oauth2',
    scheme: undefined,
    bearerFormat: undefined,
    in: undefined,
    name: undefined,
    description: undefined,
  };

  it('prefers an http bearer scheme', () => {
    expect(findBearerSchemeName({ apiKeyAuth: apiKey, bearerAuth: bearer, oauthAuth: oauth2 })).toBe('bearerAuth');
  });

  it('falls back to oauth2/openIdConnect when no http bearer scheme exists', () => {
    expect(findBearerSchemeName({ apiKeyAuth: apiKey, oauthAuth: oauth2 })).toBe('oauthAuth');
  });

  it('returns undefined when only unsuitable schemes exist (apiKey, basic)', () => {
    expect(findBearerSchemeName({ apiKeyAuth: apiKey, basicAuth: basic })).toBeUndefined();
  });

  it('returns undefined for an empty scheme map', () => {
    expect(findBearerSchemeName({})).toBeUndefined();
  });
});
