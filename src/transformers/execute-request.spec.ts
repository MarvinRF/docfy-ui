// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Endpoint, SecuritySchemeInfo } from '../document-model/types';
import { buildRequestUrl, applyAuth, executeRequest } from './execute-request';

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

describe('buildRequestUrl()', () => {
  it('substitutes path params and appends filled query params', () => {
    const endpoint = baseEndpoint({
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: undefined },
        { name: 'verbose', in: 'query', required: false, schema: { type: 'boolean' }, description: undefined },
      ],
    });
    const url = buildRequestUrl(endpoint, 'http://localhost:3000', { id: '42', verbose: 'true' });
    expect(url).toBe('http://localhost:3000/items/42?verbose=true');
  });

  it('skips empty/unset query params and strips trailing slash from baseUrl', () => {
    const endpoint = baseEndpoint({
      parameters: [{ name: 'id', in: 'path', required: true, schema: undefined, description: undefined }],
    });
    const url = buildRequestUrl(endpoint, 'http://localhost:3000/', { id: '1' });
    expect(url).toBe('http://localhost:3000/items/1');
  });
});

describe('applyAuth()', () => {
  const apiKeyScheme: Record<string, SecuritySchemeInfo> = {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      scheme: undefined,
      bearerFormat: undefined,
      description: undefined,
    },
  };
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
  const basicScheme: Record<string, SecuritySchemeInfo> = {
    basicAuth: {
      type: 'http',
      scheme: 'basic',
      bearerFormat: undefined,
      in: undefined,
      name: undefined,
      description: undefined,
    },
  };
  const apiKeyQueryScheme: Record<string, SecuritySchemeInfo> = {
    apiKeyQuery: {
      type: 'apiKey',
      in: 'query',
      name: 'api_key',
      scheme: undefined,
      bearerFormat: undefined,
      description: undefined,
    },
  };

  it('sets an apiKey header when the scheme value is present', () => {
    const headers = new Headers();
    applyAuth('http://x/y', headers, [{ apiKeyAuth: [] }], apiKeyScheme, { apiKeyAuth: 'secret' });
    expect(headers.get('X-API-Key')).toBe('secret');
  });

  it('appends an apiKey query param', () => {
    const headers = new Headers();
    const url = applyAuth('http://x/y', headers, [{ apiKeyQuery: [] }], apiKeyQueryScheme, { apiKeyQuery: 'secret' });
    expect(url).toBe('http://x/y?api_key=secret');
  });

  it('sets a Bearer Authorization header for http bearer', () => {
    const headers = new Headers();
    applyAuth('http://x/y', headers, [{ bearerAuth: [] }], bearerScheme, { bearerAuth: 'token123' });
    expect(headers.get('Authorization')).toBe('Bearer token123');
  });

  it('base64-encodes user:pass for http basic', () => {
    const headers = new Headers();
    applyAuth('http://x/y', headers, [{ basicAuth: [] }], basicScheme, { basicAuth: 'user:pass' });
    expect(headers.get('Authorization')).toBe(`Basic ${btoa('user:pass')}`);
  });

  it('picks the first alternative that has a value filled in', () => {
    const headers = new Headers();
    applyAuth(
      'http://x/y',
      headers,
      [{ apiKeyAuth: [] }, { bearerAuth: [] }],
      { ...apiKeyScheme, ...bearerScheme },
      {
        bearerAuth: 'token123',
      },
    );
    expect(headers.get('Authorization')).toBe('Bearer token123');
    expect(headers.get('X-API-Key')).toBeNull();
  });

  it('leaves the request unauthenticated when no alternative has a value', () => {
    const headers = new Headers();
    const url = applyAuth('http://x/y', headers, [{ apiKeyAuth: [] }], apiKeyScheme, {});
    expect(url).toBe('http://x/y');
    expect(headers.get('X-API-Key')).toBeNull();
  });
});

describe('executeRequest()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a success result for a resolved fetch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('{"ok":true}', { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const endpoint = baseEndpoint({ path: '/items', method: 'GET' });
    const result = await executeRequest(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: undefined,
      authValues: {},
      securitySchemes: {},
    });

    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.status).toBe(200);
      expect(result.bodyText).toBe('{"ok":true}');
    }
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/items', expect.objectContaining({ method: 'GET' }));
  });

  it('classifies a rejected fetch as a network error with a friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const endpoint = baseEndpoint({ path: '/items', method: 'GET' });
    const result = await executeRequest(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: undefined,
      authValues: {},
      securitySchemes: {},
    });

    expect(result.kind).toBe('network-error');
    if (result.kind === 'network-error') {
      expect(result.message).toMatch(/CORS/);
    }
  });

  it('sends the body and Content-Type header when a request body is present', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const endpoint = baseEndpoint({
      path: '/items',
      method: 'POST',
      requestBody: { required: true, contentType: 'application/json', schema: undefined },
    });
    await executeRequest(endpoint, {
      baseUrl: 'http://localhost:3000',
      paramValues: {},
      bodyText: '{"name":"a"}',
      authValues: {},
      securitySchemes: {},
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe('{"name":"a"}');
    expect(init.headers.get('Content-Type')).toBe('application/json');
  });

  describe('when window.__DOCFY_PROXY_PATH__ is configured', () => {
    afterEach(() => {
      delete (window as { __DOCFY_PROXY_PATH__?: string }).__DOCFY_PROXY_PATH__;
    });

    it('POSTs an envelope to the proxy path instead of fetching the target directly', async () => {
      window.__DOCFY_PROXY_PATH__ = '/docs/__docfy_proxy';
      const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);

      const endpoint = baseEndpoint({ path: '/items', method: 'GET' });
      await executeRequest(endpoint, {
        baseUrl: 'http://localhost:3000',
        paramValues: {},
        bodyText: undefined,
        authValues: {},
        securitySchemes: {},
      });

      const [calledUrl, init] = fetchMock.mock.calls[0];
      expect(calledUrl).toBe('/docs/__docfy_proxy');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({
        method: 'GET',
        url: 'http://localhost:3000/items',
        headers: {},
        body: undefined,
      });
    });

    it('treats a response with X-Docfy-Proxy-Error as a network error, using the JSON message', async () => {
      window.__DOCFY_PROXY_PATH__ = '/docs/__docfy_proxy';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: 'origin_not_allowed', message: 'not in allowlist' }), {
            status: 403,
            headers: { 'x-docfy-proxy-error': 'origin_not_allowed' },
          }),
        ),
      );

      const endpoint = baseEndpoint({ path: '/items', method: 'GET' });
      const result = await executeRequest(endpoint, {
        baseUrl: 'http://localhost:3000',
        paramValues: {},
        bodyText: undefined,
        authValues: {},
        securitySchemes: {},
      });

      expect(result).toEqual({ kind: 'network-error', message: 'not in allowlist' });
    });

    it('treats a response without the proxy-error header as a real success, passthrough status/body', async () => {
      window.__DOCFY_PROXY_PATH__ = '/docs/__docfy_proxy';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 201, statusText: 'Created' })),
      );

      const endpoint = baseEndpoint({ path: '/items', method: 'GET' });
      const result = await executeRequest(endpoint, {
        baseUrl: 'http://localhost:3000',
        paramValues: {},
        bodyText: undefined,
        authValues: {},
        securitySchemes: {},
      });

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.status).toBe(201);
        expect(result.bodyText).toBe('{"id":1}');
      }
    });
  });
});
