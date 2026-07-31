import { describe, it, expect } from 'vitest';
import type { Endpoint, SecuritySchemeInfo } from '../document-model/types';
import { buildCurlCommand } from './build-curl';

function baseEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/items/{id}',
    operationId: undefined,
    summary: undefined,
    description: undefined,
    tags: [],
    parameters: [],
    requestBody: undefined,
    responses: [],
    security: [],
    ...overrides,
  };
}

describe('buildCurlCommand()', () => {
  it('builds a plain GET with substituted path/query params', () => {
    const endpoint = baseEndpoint({
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: undefined },
        { name: 'verbose', in: 'query', required: false, schema: { type: 'boolean' }, description: undefined },
      ],
    });
    const curl = buildCurlCommand(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: { id: '42', verbose: 'true' },
      bodyText: undefined,
      authValues: {},
      securitySchemes: {},
    });
    expect(curl).toBe(`curl -X GET 'http://localhost:3000/items/42?verbose=true'`);
  });

  it('includes a real header param value', () => {
    const endpoint = baseEndpoint({
      path: '/items',
      parameters: [{ name: 'X-Trace-Id', in: 'header', required: false, schema: undefined, description: undefined }],
    });
    const curl = buildCurlCommand(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: { 'X-Trace-Id': 'abc123' },
      bodyText: undefined,
      authValues: {},
      securitySchemes: {},
    });
    expect(curl).toBe(`curl -X GET 'http://localhost:3000/items' \\\n  -H 'x-trace-id: abc123'`);
  });

  it('applies resolved bearer auth as a real Authorization header', () => {
    const endpoint = baseEndpoint({
      path: '/items',
      security: [{ bearerAuth: [] }],
    });
    const bearerScheme: Record<string, SecuritySchemeInfo> = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: undefined,
        name: undefined,
        description: undefined,
      },
    };
    const curl = buildCurlCommand(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: undefined,
      authValues: { bearerAuth: 'real-token' },
      securitySchemes: bearerScheme,
    });
    // `Headers` lowercases names on iteration (Fetch API behavior) — harmless, HTTP headers
    // are case-insensitive, and this is exactly what `executeRequest()` sends over the wire too.
    expect(curl).toBe(`curl -X GET 'http://localhost:3000/items' \\\n  -H 'authorization: Bearer real-token'`);
  });

  it('includes the actual (edited) request body and its Content-Type', () => {
    const endpoint = baseEndpoint({
      path: '/items',
      method: 'POST',
      requestBody: { required: true, contentType: 'application/json', schema: undefined },
    });
    const curl = buildCurlCommand(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: '{"name":"custom"}',
      authValues: {},
      securitySchemes: {},
    });
    expect(curl).toBe(
      `curl -X POST 'http://localhost:3000/items' \\\n  -H 'content-type: application/json' \\\n  -d '{"name":"custom"}'`,
    );
  });

  it('single-quote-escapes values that themselves contain a single quote', () => {
    const endpoint = baseEndpoint({
      path: '/items',
      method: 'POST',
      requestBody: { required: true, contentType: 'application/json', schema: undefined },
    });
    const curl = buildCurlCommand(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: `{"name":"O'Brien"}`,
      authValues: {},
      securitySchemes: {},
    });
    expect(curl).toContain(`O'\\''Brien`);
  });

  it('omits an empty/blank body from -d', () => {
    const endpoint = baseEndpoint({
      path: '/items',
      method: 'POST',
      requestBody: { required: false, contentType: 'application/json', schema: undefined },
    });
    const curl = buildCurlCommand(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: '   ',
      authValues: {},
      securitySchemes: {},
    });
    expect(curl).toBe(`curl -X POST 'http://localhost:3000/items'`);
  });
});
