import { describe, it, expect } from 'vitest';
import { schemaToTreeNodes } from './schema-tree';
import type { JSONSchemaLike } from './types';

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

  it('merges allOf into an object node instead of falling back to "unknown"', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: {
        owner: {
          allOf: [
            { type: 'object', properties: { id: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        },
      },
    });
    expect(nodes[0]).toMatchObject({ name: 'owner', type: 'object' });
    expect(nodes[0].children).toEqual([
      { name: 'id', type: 'string', required: false, nullable: false },
      { name: 'name', type: 'string', required: false, nullable: false },
    ]);
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

  describe('circular schemas (recursive DTOs)', () => {
    it('shows the recursive property one level deep, then flags the next repeat as circular', () => {
      const user: JSONSchemaLike = { type: 'object', properties: { id: { type: 'string' } } };
      (user.properties as Record<string, unknown>).parent = user;

      const nodes = schemaToTreeNodes(user);
      const parentNode = nodes.find((n) => n.name === 'parent')!;
      expect(parentNode.circular).toBeUndefined();
      expect(parentNode.children!.map((n) => n.name)).toEqual(['id', 'parent']);

      const nestedParent = parentNode.children!.find((n) => n.name === 'parent')!;
      expect(nestedParent.circular).toBe(true);
      expect(nestedParent.children).toBeUndefined();
    });

    it('handles mutual recursion (A -> B -> A) without infinite recursion', () => {
      const a: JSONSchemaLike = { type: 'object', properties: {} };
      const b: JSONSchemaLike = { type: 'object', properties: { a } };
      (a.properties as Record<string, unknown>).b = b;

      expect(() => schemaToTreeNodes(a)).not.toThrow();
      const nodes = schemaToTreeNodes(a);
      const bNode = nodes.find((n) => n.name === 'b')!;
      // a -> b (shown) -> a (one level deep, shown) -> b (circular, stops here)
      const aInsideB = bNode.children!.find((n) => n.name === 'a')!;
      expect(aInsideB.circular).toBeUndefined();
      const bInsideA = aInsideB.children!.find((n) => n.name === 'b')!;
      expect(bInsideA.circular).toBe(true);
      expect(bInsideA.children).toBeUndefined();
    });

    it('detects a self-referencing array item (Category.children: Category[])', () => {
      const category: JSONSchemaLike = { type: 'object', properties: { name: { type: 'string' } } };
      (category.properties as Record<string, unknown>).children = { type: 'array', items: category };

      const nodes = schemaToTreeNodes(category);
      const childrenNode = nodes.find((n) => n.name === 'children[]')!;
      expect(childrenNode.circular).toBeUndefined();

      const nestedChildren = childrenNode.children!.find((n) => n.name === 'children[]')!;
      expect(nestedChildren.circular).toBe(true);
      expect(nestedChildren.children).toBeUndefined();
    });

    it('catches two distinct array properties pointing at the same recursive type without an extra level', () => {
      const category: JSONSchemaLike = { type: 'object', properties: { name: { type: 'string' } } };
      (category.properties as Record<string, unknown>).children = { type: 'array', items: category };
      (category.properties as Record<string, unknown>).related = { type: 'array', items: category };

      const nodes = schemaToTreeNodes(category);
      const childrenNode = nodes.find((n) => n.name === 'children[]')!;
      const relatedInsideChildren = childrenNode.children!.find((n) => n.name === 'related[]')!;
      expect(relatedInsideChildren.circular).toBe(true);
      expect(relatedInsideChildren.children).toBeUndefined();
    });

    it('does NOT flag the same schema object appearing in two sibling branches as circular', () => {
      const role: JSONSchemaLike = { type: 'object', properties: { name: { type: 'string' } } };
      const nodes = schemaToTreeNodes({
        type: 'object',
        properties: { createdBy: role, updatedBy: role },
      });

      expect(nodes.find((n) => n.name === 'createdBy')!.circular).toBeUndefined();
      expect(nodes.find((n) => n.name === 'updatedBy')!.circular).toBeUndefined();
      expect(nodes.find((n) => n.name === 'createdBy')!.children).toEqual([
        { name: 'name', type: 'string', required: false, nullable: false },
      ]);
    });

    it('detects a cycle hidden behind oneOf/anyOf', () => {
      const user: JSONSchemaLike = { type: 'object', properties: { id: { type: 'string' } } };
      (user.properties as Record<string, unknown>).parent = { oneOf: [user] };

      const nodes = schemaToTreeNodes(user);
      const parentNode = nodes.find((n) => n.name === 'parent')!;
      const nestedParent = parentNode.children!.find((n) => n.name === 'parent')!;
      expect(nestedParent.circular).toBe(true);
    });
  });
});
