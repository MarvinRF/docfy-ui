import { describe, it, expect } from 'vitest';
import { buildSchemaAnchorHash, parseSchemaAnchorHash, buildSchemaAnchorId } from './schema-anchor';

describe('buildSchemaAnchorHash()', () => {
  it('joins scope and path segments with #, percent-encoding each one', () => {
    expect(buildSchemaAnchorHash('response-200', ['address', 'city'])).toBe('#response-200/address/city');
  });

  it('percent-encodes segments containing slashes or special characters', () => {
    expect(buildSchemaAnchorHash('request-body', ['a/b', 'c d'])).toBe('#request-body/a%2Fb/c%20d');
  });

  it('supports an empty path (scope only)', () => {
    expect(buildSchemaAnchorHash('request-body', [])).toBe('#request-body');
  });
});

describe('parseSchemaAnchorHash()', () => {
  it('parses a hash with the leading # into scope + path', () => {
    expect(parseSchemaAnchorHash('#response-200/address/city')).toEqual({
      scope: 'response-200',
      path: ['address', 'city'],
    });
  });

  it('parses a hash without the leading #', () => {
    expect(parseSchemaAnchorHash('response-200/address/city')).toEqual({
      scope: 'response-200',
      path: ['address', 'city'],
    });
  });

  it('decodes percent-encoded segments', () => {
    expect(parseSchemaAnchorHash('#request-body/a%2Fb/c%20d')).toEqual({
      scope: 'request-body',
      path: ['a/b', 'c d'],
    });
  });

  it('returns a scope-only anchor for a hash with no path segments', () => {
    expect(parseSchemaAnchorHash('#request-body')).toEqual({ scope: 'request-body', path: [] });
  });

  it('returns null for an empty hash', () => {
    expect(parseSchemaAnchorHash('')).toBeNull();
    expect(parseSchemaAnchorHash('#')).toBeNull();
  });

  it('round-trips through build then parse', () => {
    const hash = buildSchemaAnchorHash('response-404', ['errors', 'items', 'field']);
    expect(parseSchemaAnchorHash(hash)).toEqual({ scope: 'response-404', path: ['errors', 'items', 'field'] });
  });
});

describe('buildSchemaAnchorId()', () => {
  it('builds a DOM id from scope and path', () => {
    expect(buildSchemaAnchorId('response-200', ['address', 'city'])).toBe('schema-anchor-response-200-address-city');
  });

  it('handles an empty path', () => {
    expect(buildSchemaAnchorId('request-body', [])).toBe('schema-anchor-request-body-');
  });
});
