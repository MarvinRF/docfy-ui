import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture30 = path.join(__dirname, 'fixtures', 'spec-3.0.json');
const fixture31 = path.join(__dirname, 'fixtures', 'spec-3.1.json');

/**
 * Spike result (Phase 1 of the implementation plan): compared
 * @apidevtools/swagger-parser against @readme/openapi-parser for 3.0/3.1
 * dereferencing. Both passed identical functional tests (3.1 nullable
 * `type: [...]` unions, `const`, `oneOf`, circular refs) — no compatibility
 * gap. Chose @apidevtools/swagger-parser: ~5x smaller (55KB vs 298KB
 * packed), declares a `browser` field on its core ref-resolution
 * dependency (proven for client-side bundling), and doesn't pull in the
 * full ajv validation stack @readme/openapi-parser carries for its own
 * Node-based use case — none of which the Document Model needs.
 *
 * These tests stay as regression protection for that decision.
 */
describe('parser spike — OpenAPI 3.0', () => {
  it('dereferences 3.0 without error', async () => {
    const result = await SwaggerParser.dereference(fixture30) as Record<string, unknown>;
    expect(result.openapi).toBe('3.0.3');
  });
});

describe('parser spike — OpenAPI 3.1', () => {
  it('dereferences 3.1 and preserves type:[..] nullable unions', async () => {
    const result = await SwaggerParser.dereference(fixture31) as any;
    expect(result.openapi).toBe('3.1.0');

    const userSchema = result.components.schemas.User;
    // 3.1-specific: nullable expressed as type: ["string", "null"], not `nullable: true`
    expect(userSchema.properties.nickname.type).toEqual(['string', 'null']);
  });

  it('preserves `const` inside oneOf branches', async () => {
    const result = await SwaggerParser.dereference(fixture31) as any;
    const roleSchema = result.components.schemas.CreateUserDto.properties.role;
    expect(roleSchema.oneOf).toHaveLength(2);
    expect(roleSchema.oneOf[0].properties.kind.const).toBe('admin');
  });
});

describe('parser spike — circular refs (recursive DTO)', () => {
  it('resolves a self-referencing schema as an object cycle, not infinite recursion', async () => {
    const result = await SwaggerParser.dereference(fixture30) as any;
    const userSchema = result.components.schemas.User;
    expect(userSchema.properties.parent).toBe(userSchema);
  });
});
