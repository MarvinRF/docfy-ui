// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';

const SAMPLE_SPEC = {
  openapi: '3.0.3',
  info: { title: 'Sample', version: '1.0.0' },
  paths: {
    '/users': { get: { tags: ['users'], summary: 'List users', responses: { '200': { description: 'OK' } } } },
  },
};

describe('<App />', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('shows a loading message before the spec resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<App />);
    expect(screen.getByText(/loading spec/i)).toBeInTheDocument();
  });

  it('renders the shell once the spec loads successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(SAMPLE_SPEC) })),
    );
    render(<App />);
    await waitFor(() => expect(screen.getByText('List users')).toBeInTheDocument());
  });

  it('shows an error message when the spec fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' })));
    render(<App />);
    await waitFor(() => expect(screen.getByText(/failed to load spec/i)).toBeInTheDocument());
  });

  it('prefixes rendered links with window.__DOCFY_BASE_PATH__ when the host injects a mount prefix', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(SAMPLE_SPEC) })),
    );
    vi.stubGlobal('__DOCFY_BASE_PATH__', '/docs/');
    // Router basename requires the current URL to already be under the prefix —
    // exactly what happens in a real browser navigating to a non-root mount.
    window.history.pushState({}, '', '/docs/');

    render(<App />);

    const link = await screen.findByRole('link', { name: /list users/i });
    expect(link.getAttribute('href')).toMatch(/^\/docs\//);
  });

  it('defaults to a root basename when window.__DOCFY_BASE_PATH__ is not set', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(SAMPLE_SPEC) })),
    );

    render(<App />);

    const link = await screen.findByRole('link', { name: /list users/i });
    expect(link.getAttribute('href')).not.toMatch(/^\/docs/);
  });
});
