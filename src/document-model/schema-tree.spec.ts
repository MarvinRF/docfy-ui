import { describe, it, expect } from 'vitest';
import { schemaToTreeNodes } from './schema-tree';

describe('schemaToTreeNodes()', () => {
  it('returns an empty array for an undefined schema', () => {
    expect(schemaToTreeNodes(undefined)).toEqual([]);
  });

  it('builds leaf nodes for primitive properties', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { id: { type: 'string' }, age: { type: 'integer' } },
    });
    expect(nodes).toEqual([
      { name: 'id', type: 'string', required: false, nullable: false },
      { name: 'age', type: 'integer', required: false, nullable: false },
    ]);
  });

  it('marks properties listed in required: true', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    });
    expect(nodes[0].required).toBe(true);
  });

  it('marks nullable via type:[..., "null"] (3.1-style)', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { nickname: { type: ['string', 'null'] } },
    });
    expect(nodes[0]).toMatchObject({ type: 'string', nullable: true });
  });

  it('marks nullable via the `nullable: true` keyword (3.0-style)', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { nickname: { type: 'string', nullable: true } },
    });
    expect(nodes[0]).toMatchObject({ type: 'string', nullable: true });
  });

  it('builds an object node with nested children', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { zip: { type: 'string' } },
        },
      },
    });
    expect(nodes[0]).toMatchObject({ name: 'address', type: 'object' });
    expect(nodes[0].children).toEqual([{ name: 'zip', type: 'string', required: false, nullable: false }]);
  });

  it('appends [] to the name for arrays and recurses into object items', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: {
        customers: {
          type: 'array',
          items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
        },
      },
    });
    expect(nodes[0].name).toBe('customers[]');
    expect(nodes[0].type).toBe('array');
    expect(nodes[0].children).toEqual([
      { name: 'id', type: 'string', required: false, nullable: false },
      { name: 'name', type: 'string', required: false, nullable: false },
    ]);
  });

  it('does not recurse into arrays of primitives (no children)', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    });
    expect(nodes[0].children).toBeUndefined();
  });

  it('resolves oneOf/anyOf to the first variant before building the node', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: {
        role: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
      },
    });
    expect(nodes[0]).toMatchObject({ name: 'role', type: 'string' });
  });

  it('reproduces the customers search example tree shape from the user request', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            customers: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } } },
            message: { type: 'string' },
            success: { type: 'boolean' },
          },
        },
      },
    });

    expect(nodes[0].name).toBe('data');
    const dataChildren = nodes[0].children!;
    expect(dataChildren.map((n) => n.name)).toEqual(['customers[]', 'message', 'success']);
  });
});
