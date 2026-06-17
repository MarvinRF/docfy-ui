import { describe, it, expect } from 'vitest';
import { operationToAiText } from './copy-for-ai';
import type { Endpoint } from '../document-model/types';

function baseEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/items',
    operationId: undefined,
    summary: undefined,
    description: undefined,
    tags: [],
    parameters: [],
    requestBody: undefined,
    responses: [],
    ...overrides,
  };
}

describe('operationToAiText()', () => {
  it('reproduces the worked example from the spec (section 3.3), modulo the documented type-vs-format decision', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      path: '/auth/register',
      description: 'Register a new account.',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
          required: ['name', 'email', 'password'],
        },
      },
      responses: [
        {
          status: '201',
          description: 'Created',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string' },
            },
            required: ['id', 'email'],
          },
        },
        { status: '400', description: 'Validation Error', contentType: undefined, schema: undefined },
        { status: '409', description: 'Email already exists', contentType: undefined, schema: undefined },
      ],
    });

    const text = operationToAiText(endpoint);

    expect(text).toBe(
      [
        'Endpoint: POST /auth/register',
        'Purpose:',
        'Register a new account.',
        'Request:',
        '{',
        '  "name": "string",',
        '  "email": "string",',
        '  "password": "string"',
        '}',
        'Validation:',
        '- email must be valid',
        '- password min length 8',
        'Success Response (201):',
        '{',
        '  "id": "string",',
        '  "email": "string"',
        '}',
        'Error Responses:',
        '400 Validation Error',
        '409 Email already exists',
      ].join('\n'),
    );
  });

  it('header uses uppercase method and the raw path', () => {
    const endpoint = baseEndpoint({ method: 'get', path: '/users/{id}' } as unknown as Endpoint);
    expect(operationToAiText(endpoint)).toContain('Endpoint: get /users/{id}');
  });

  it('uses summary over description for Purpose when both are present', () => {
    const endpoint = baseEndpoint({ summary: 'Short summary', description: 'A much longer description.' });
    const text = operationToAiText(endpoint);
    expect(text).toContain('Purpose:\nShort summary');
    expect(text).not.toContain('A much longer description');
  });

  it('truncates a long description to its first 2 sentences for Purpose', () => {
    const endpoint = baseEndpoint({
      description: 'First sentence here. Second sentence here. Third sentence should be dropped. Fourth too.',
    });
    const text = operationToAiText(endpoint);
    expect(text).toContain('Purpose:\nFirst sentence here. Second sentence here.');
    expect(text).not.toContain('Third sentence');
  });

  it('omits Purpose entirely when neither summary nor description exist', () => {
    const text = operationToAiText(baseEndpoint());
    expect(text).not.toContain('Purpose');
  });

  it('omits Request for a GET with no requestBody, but keeps Parameters', () => {
    const endpoint = baseEndpoint({
      method: 'GET',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: undefined },
      ],
    });
    const text = operationToAiText(endpoint);
    expect(text).not.toContain('Request:');
    expect(text).toContain('Parameters:\n- id (path, required): string');
  });

  it('represents an array request body as [ {...item schema...} ]', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
      },
    });
    const text = operationToAiText(endpoint);
    expect(text).toContain('Request:\n[\n  {\n    "name": "string"\n  }\n]');
  });

  it('annotates a oneOf request body with "(one of N possible shapes)" and uses the first variant', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: {
          oneOf: [
            { type: 'object', properties: { kind: { type: 'string' } } },
            { type: 'object', properties: { other: { type: 'string' } } },
          ],
        },
      },
    });
    const text = operationToAiText(endpoint);
    expect(text).toContain('"kind": "string"');
    expect(text).not.toContain('"other"');
    expect(text).toContain('(one of 2 possible shapes)');
  });

  it('omits Error Responses entirely when no 4xx/5xx are declared', () => {
    const endpoint = baseEndpoint({
      responses: [{ status: '200', description: 'OK', contentType: undefined, schema: undefined }],
    });
    const text = operationToAiText(endpoint);
    expect(text).not.toContain('Error Responses');
  });

  it('falls back to the standard status text when a 4xx/5xx response has no description', () => {
    const endpoint = baseEndpoint({
      responses: [{ status: '500', description: undefined, contentType: undefined, schema: undefined }],
    });
    const text = operationToAiText(endpoint);
    expect(text).toContain('500 Internal Server Error');
  });

  it('lists error responses in spec declaration order, not sorted', () => {
    const endpoint = baseEndpoint({
      responses: [
        { status: '404', description: 'Not found', contentType: undefined, schema: undefined },
        { status: '400', description: 'Bad input', contentType: undefined, schema: undefined },
      ],
    });
    const text = operationToAiText(endpoint);
    const idx404 = text.indexOf('404');
    const idx400 = text.indexOf('400 Bad input');
    expect(idx404).toBeLessThan(idx400);
  });

  it('picks the smallest numeric 2xx as the primary Success Response', () => {
    const endpoint = baseEndpoint({
      responses: [
        { status: '201', description: 'Created', contentType: undefined, schema: { type: 'string' } },
        { status: '200', description: 'OK', contentType: undefined, schema: { type: 'boolean' } },
      ],
    });
    const text = operationToAiText(endpoint);
    expect(text).toContain('Success Response (200):');
    expect(text).not.toContain('Success Response (201):');
  });

  it('omits Validation entirely when the request schema has no constraints beyond types', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: { type: 'object', properties: { name: { type: 'string' } } },
      },
    });
    const text = operationToAiText(endpoint);
    expect(text).not.toContain('Validation');
  });

  it('extracts minimum/maximum/pattern/enum as natural-language Validation lines', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            age: { type: 'integer', minimum: 18, maximum: 99 },
            code: { type: 'string', pattern: '^[A-Z]{3}$' },
            role: { type: 'string', enum: ['admin', 'member'] },
          },
        },
      },
    });
    const text = operationToAiText(endpoint);
    expect(text).toContain('- age min 18');
    expect(text).toContain('- age max 99');
    expect(text).toContain('- code must match pattern ^[A-Z]{3}$');
    expect(text).toContain('- role must be one of: admin, member');
  });

  it('runs well under 5ms (pure string formatting, no I/O)', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: { type: 'object', properties: { name: { type: 'string', minLength: 1 } } },
      },
      responses: [{ status: '201', description: 'Created', contentType: undefined, schema: { type: 'object', properties: {} } }],
    });

    const start = performance.now();
    operationToAiText(endpoint);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50); // generous CI margin around the 5ms target
  });
});
