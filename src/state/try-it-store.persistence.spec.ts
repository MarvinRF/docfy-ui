// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'docfy-ui:auth-values';

describe('useTryItStore auth persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    // Each test needs a fresh module evaluation, since `authValues`'s initial
    // value is read from localStorage once, at module load / store creation time.
    vi.resetModules();
  });

  it('setAuthValue() writes through to localStorage', async () => {
    const { useTryItStore } = await import('./try-it-store');
    useTryItStore.getState().setAuthValue('bearerAuth', 'token123');

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ bearerAuth: 'token123' });
  });

  it('loads previously saved values as the initial state on a fresh module load', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKeyAuth: 'saved-value' }));

    const { useTryItStore } = await import('./try-it-store');
    expect(useTryItStore.getState().authValues).toEqual({ apiKeyAuth: 'saved-value' });
  });

  it('falls back to an empty object when localStorage holds malformed JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    const { useTryItStore } = await import('./try-it-store');
    expect(useTryItStore.getState().authValues).toEqual({});
  });
});
