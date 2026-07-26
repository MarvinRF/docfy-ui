// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSpecStore, getInitialUrl, getConfiguredSpecs } from './spec-store';

describe('getInitialUrl()', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('defaults to /api-json when no specs are configured and no ?spec= override', () => {
    expect(getInitialUrl([])).toBe('/api-json');
  });

  it('defaults to the first configured spec when there is no ?spec= override', () => {
    const specs = [
      { name: 'users', url: '/users/api-json' },
      { name: 'orders', url: '/orders/api-json' },
    ];
    expect(getInitialUrl(specs)).toBe('/users/api-json');
  });

  it('?spec= override wins even when specs are configured', () => {
    window.history.pushState({}, '', '/?spec=/override-spec.json');
    const specs = [{ name: 'users', url: '/users/api-json' }];
    expect(getInitialUrl(specs)).toBe('/override-spec.json');
  });
});

describe('getConfiguredSpecs()', () => {
  afterEach(() => {
    delete (window as { __DOCFY_SPECS__?: unknown }).__DOCFY_SPECS__;
  });

  it('returns an empty array when window.__DOCFY_SPECS__ is not set', () => {
    expect(getConfiguredSpecs()).toEqual([]);
  });

  it('returns window.__DOCFY_SPECS__ when set', () => {
    const specs = [{ name: 'users', url: '/users/api-json' }];
    window.__DOCFY_SPECS__ = specs;
    expect(getConfiguredSpecs()).toEqual(specs);
  });
});

describe('useSpecStore', () => {
  beforeEach(() => {
    useSpecStore.setState({ specs: [], currentUrl: '/api-json' });
  });

  it('setCurrentUrl updates currentUrl', () => {
    useSpecStore.getState().setCurrentUrl('/other/api-json');
    expect(useSpecStore.getState().currentUrl).toBe('/other/api-json');
  });

  it('setCurrentUrl does not touch the configured specs list', () => {
    const specs = [{ name: 'users', url: '/users/api-json' }];
    useSpecStore.setState({ specs, currentUrl: specs[0].url });
    useSpecStore.getState().setCurrentUrl('/other/api-json');
    expect(useSpecStore.getState().specs).toEqual(specs);
  });
});
