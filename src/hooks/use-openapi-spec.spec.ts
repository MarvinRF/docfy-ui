// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOpenApiSpec } from './use-openapi-spec';

const SAMPLE_SPEC = {
  openapi: '3.0.3',
  info: { title: 'Sample', version: '1.0.0' },
  paths: {
    '/users': {
      get: { tags: ['users'], summary: 'List users', responses: { '200': { description: 'OK' } } },
    },
  },
};

describe('useOpenApiSpec()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in the loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { result } = renderHook(() => useOpenApiSpec('/api-json'));
    expect(result.current.status).toBe('loading');
  });

  it('transitions to success with the normalized Document Model', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(SAMPLE_SPEC) })),
    );

    const { result } = renderHook(() => useOpenApiSpec('/api-json'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    if (result.current.status === 'success') {
      expect(result.current.data.info.title).toBe('Sample');
      expect(result.current.data.tagGroups[0].name).toBe('users');
    }
  });

  it('transitions to error when the fetch response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' })),
    );

    const { result } = renderHook(() => useOpenApiSpec('/api-json'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    if (result.current.status === 'error') {
      expect(result.current.error).toContain('500');
    }
  });

  it('transitions to error when fetch itself rejects (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network down'))));

    const { result } = renderHook(() => useOpenApiSpec('/api-json'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    if (result.current.status === 'error') {
      expect(result.current.error).toBe('Network down');
    }
  });

  it('re-fetches when the url changes', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(SAMPLE_SPEC) }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(({ url }) => useOpenApiSpec(url), { initialProps: { url: '/a-json' } });
    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender({ url: '/b-json' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/b-json'));
  });
});
