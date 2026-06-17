import { describe, it, expect } from 'vitest';
import { buildCodeSnippet, buildSnippetUrl, SNIPPET_LANGUAGES } from './code-snippets';
import type { Endpoint } from '../document-model/types';

function baseEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/users',
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

describe('buildSnippetUrl()', () => {
  it('joins baseUrl and path with no query params', () => {
    expect(buildSnippetUrl(baseEndpoint(), 'https://api.example.com')).toBe('https://api.example.com/users');
  });

  it('strips a trailing slash from baseUrl', () => {
    expect(buildSnippetUrl(baseEndpoint(), 'https://api.example.com/')).toBe('https://api.example.com/users');
  });

  it('appends query parameters as name=type placeholders', () => {
    const endpoint = baseEndpoint({
      parameters: [
        { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: undefined },
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer' }, description: undefined },
      ],
    });
    expect(buildSnippetUrl(endpoint, 'https://api.example.com')).toBe('https://api.example.com/users?search=string&limit=integer');
  });

  it('does not include path or header parameters in the query string', () => {
    const endpoint = baseEndpoint({
      path: '/users/{id}',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: undefined },
        { name: 'x-api-key', in: 'header', required: true, schema: { type: 'string' }, description: undefined },
      ],
    });
    expect(buildSnippetUrl(endpoint, 'https://api.example.com')).toBe('https://api.example.com/users/{id}');
  });
});

describe('buildCodeSnippet()', () => {
  it('exposes exactly 5 supported languages', () => {
    expect(SNIPPET_LANGUAGES.map((l) => l.id)).toEqual(['curl', 'javascript', 'axios', 'python', 'php']);
  });

  it('generates a curl snippet without a body for GET', () => {
    const snippet = buildCodeSnippet(baseEndpoint(), 'https://api.example.com', 'curl');
    expect(snippet).toBe(`curl -X GET 'https://api.example.com/users'`);
  });

  it('generates a curl snippet with -d and Content-Type when a body is present', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: { required: true, contentType: 'application/json', schema: { type: 'object', properties: { name: { type: 'string' } } } },
    });
    const snippet = buildCodeSnippet(endpoint, 'https://api.example.com', 'curl');
    expect(snippet).toContain(`curl -X POST 'https://api.example.com/users' \\`);
    expect(snippet).toContain(`-H 'Content-Type: application/json'`);
    expect(snippet).toContain(`-d '{`);
    expect(snippet).toContain(`"name": "string"`);
  });

  it('generates a fetch snippet with JSON.stringify for the body', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: { required: true, contentType: 'application/json', schema: { type: 'object', properties: { name: { type: 'string' } } } },
    });
    const snippet = buildCodeSnippet(endpoint, 'https://api.example.com', 'javascript');
    expect(snippet).toContain(`fetch('https://api.example.com/users', {`);
    expect(snippet).toContain(`method: 'POST',`);
    expect(snippet).toContain(`body: JSON.stringify({`);
  });

  it('generates an axios snippet using the lowercase HTTP method as the call', () => {
    const endpoint = baseEndpoint({ method: 'DELETE', path: '/users/1' });
    expect(buildCodeSnippet(endpoint, 'https://api.example.com', 'axios')).toBe(`axios.delete('https://api.example.com/users/1');`);
  });

  it('generates a python snippet using the requests library', () => {
    const snippet = buildCodeSnippet(baseEndpoint(), 'https://api.example.com', 'python');
    expect(snippet).toContain('import requests');
    expect(snippet).toContain(`response = requests.get('https://api.example.com/users')`);
    expect(snippet).toContain('print(response.json())');
  });

  it('produces python dict-literal-compatible body JSON (double-quoted keys/values)', () => {
    const endpoint = baseEndpoint({
      method: 'POST',
      requestBody: { required: true, contentType: 'application/json', schema: { type: 'object', properties: { name: { type: 'string' } } } },
    });
    const snippet = buildCodeSnippet(endpoint, 'https://api.example.com', 'python');
    expect(snippet).toContain(`json={`);
    expect(snippet).toMatch(/"name":\s*"string"/);
  });

  it('generates a PHP curl snippet', () => {
    const snippet = buildCodeSnippet(baseEndpoint(), 'https://api.example.com', 'php');
    expect(snippet).toContain('<?php');
    expect(snippet).toContain(`curl_init('https://api.example.com/users')`);
    expect(snippet).toContain(`CURLOPT_CUSTOMREQUEST, 'GET'`);
  });
});
