import { describe, it, expect } from 'vitest';
import { buildSchemaExample, pickPrimarySuccessResponse, resolveUnion, withUnionNotes } from './example';

describe('resolveUnion()', () => {
  it('returns the schema unchanged when there is no union', () => {
    const schema = { type: 'string' };
    expect(resolveUnion(schema)).toEqual({ schema });
  });

  it('resolves oneOf to its first variant and reports the size', () => {
    const a = { type: 'string' };
    const b = { type: 'number' };
    expect(resolveUnion({ oneOf: [a, b] })).toEqual({ schema: a, unionSize: 2 });
  });

  it('resolves anyOf the same way', () => {
    const a = { type: 'boolean' };
    expect(resolveUnion({ anyOf: [a] })).toEqual({ schema: a, unionSize: 1 });
  });

  it('returns undefined schema for undefined input', () => {
    expect(resolveUnion(undefined)).toEqual({ schema: undefined });
  });
});

describe('buildSchemaExample()', () => {
  it('returns undefined for an undefined schema', () => {
    expect(buildSchemaExample(undefined)).toBeUndefined();
  });

  it('flattens object properties to type-name tokens', () => {
    const result = buildSchemaExample({
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'integer' } },
    });
    expect(result?.example).toEqual({ name: 'string', age: 'integer' });
  });

  it('represents arrays as a single-item array of the item schema', () => {
    const result = buildSchemaExample({ type: 'array', items: { type: 'string' } });
    expect(result?.example).toEqual(['string']);
  });

  it('reports union sizes for oneOf/anyOf encountered', () => {
    const result = buildSchemaExample({
      oneOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'object', properties: { b: { type: 'string' } } }],
    });
    expect(result?.unionSizes).toEqual([2]);
  });
});

describe('withUnionNotes()', () => {
  it('returns the body unchanged when there are no union sizes', () => {
    expect(withUnionNotes('body', [])).toBe('body');
  });

  it('appends one annotation line per union size', () => {
    expect(withUnionNotes('body', [2, 3])).toBe('body\n(one of 2 possible shapes)\n(one of 3 possible shapes)');
  });
});

describe('pickPrimarySuccessResponse()', () => {
  it('picks the smallest numeric 2xx', () => {
    const result = pickPrimarySuccessResponse([
      { status: '201', description: undefined, contentType: undefined, schema: undefined },
      { status: '200', description: undefined, contentType: undefined, schema: undefined },
    ]);
    expect(result?.status).toBe('200');
  });

  it('returns undefined when no 2xx is declared', () => {
    const result = pickPrimarySuccessResponse([
      { status: '400', description: undefined, contentType: undefined, schema: undefined },
    ]);
    expect(result).toBeUndefined();
  });
});
