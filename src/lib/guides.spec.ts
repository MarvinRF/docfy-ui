// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { getConfiguredGuides } from './guides';

describe('getConfiguredGuides()', () => {
  afterEach(() => {
    delete (window as { __DOCFY_GUIDES__?: unknown }).__DOCFY_GUIDES__;
  });

  it('returns an empty array when nothing is configured', () => {
    expect(getConfiguredGuides()).toEqual([]);
  });

  it('returns whatever window.__DOCFY_GUIDES__ was injected with', () => {
    const guides = [{ slug: 'a', title: 'A', content: '# A' }];
    window.__DOCFY_GUIDES__ = guides;
    expect(getConfiguredGuides()).toEqual(guides);
  });
});
