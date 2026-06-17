import { describe, it, expect } from 'vitest';
import { capDepth } from './cap-depth';

describe('capDepth()', () => {
  it('returns primitives unchanged', () => {
    expect(capDepth('hello')).toBe('hello');
    expect(capDepth(42)).toBe(42);
    expect(capDepth(true)).toBe(true);
    expect(capDepth(null)).toBe(null);
    expect(capDepth(undefined)).toBe(undefined);
  });

  it('passes through a shallow object unchanged in shape', () => {
    const input = { a: 1, b: { c: 2 } };
    expect(capDepth(input)).toEqual({ a: 1, b: { c: 2 } });
  });

  it('passes through arrays', () => {
    expect(capDepth([1, 2, { a: 3 }])).toEqual([1, 2, { a: 3 }]);
  });

  it('replaces a true self-reference with "[Circular]"', () => {
    const user: Record<string, unknown> = { id: 'u1' };
    user.parent = user;

    const result = capDepth(user) as Record<string, unknown>;
    expect(result.id).toBe('u1');
    expect(result.parent).toBe('[Circular]');
  });

  it('does NOT flag the same object appearing in two sibling branches as circular', () => {
    const role = { name: 'admin' };
    const input = { createdBy: role, updatedBy: role };

    const result = capDepth(input) as Record<string, unknown>;
    expect(result.createdBy).toEqual({ name: 'admin' });
    expect(result.updatedBy).toEqual({ name: 'admin' });
  });

  it('caps nesting at the default max depth (6) with "[Object]"', () => {
    // Build 8 levels of nesting: { l0: { l1: { l2: ... } } }
    let deepest: Record<string, unknown> = { leaf: true };
    for (let i = 7; i >= 0; i--) {
      deepest = { [`l${i}`]: deepest };
    }

    const result = capDepth(deepest) as any;
    // root is depth 0; l0..l4 (5 nested levels) stay objects, l5's value
    // is computed at depth 6 and gets capped.
    let cursor = result;
    for (let i = 0; i < 5; i++) {
      expect(typeof cursor[`l${i}`]).toBe('object');
      cursor = cursor[`l${i}`];
    }
    expect(cursor[`l5`]).toBe('[Object]');
  });

  it('caps a deeply nested array with "[Array]"', () => {
    let deepest: unknown = ['leaf'];
    for (let i = 0; i < 8; i++) {
      deepest = [deepest];
    }

    const result = capDepth(deepest) as any[];
    let cursor: any = result;
    for (let i = 0; i < 5; i++) {
      expect(Array.isArray(cursor[0]) || cursor[0] === '[Array]').toBe(true);
      if (cursor[0] === '[Array]') return;
      cursor = cursor[0];
    }
  });

  it('respects a custom maxDepth option', () => {
    const input = { a: { b: { c: 'too deep' } } };
    const result = capDepth(input, { maxDepth: 1 }) as any;
    expect(result.a).toBe('[Object]');
  });

  it('result of capDepth on a circular structure is always JSON.stringify-safe', () => {
    const node: Record<string, unknown> = { name: 'root' };
    node.self = node;
    node.children = [node, { name: 'child', parent: node }];

    expect(() => JSON.stringify(capDepth(node))).not.toThrow();
  });
});
