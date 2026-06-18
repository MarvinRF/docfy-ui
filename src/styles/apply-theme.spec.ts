// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { applyTheme } from './apply-theme';

describe('applyTheme()', () => {
  it('adds the dark class and sets data-theme for dark', () => {
    const root = document.createElement('html');
    applyTheme('dark', root);
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.dataset.theme).toBe('dark');
  });

  it('removes the dark class and sets data-theme for light', () => {
    const root = document.createElement('html');
    applyTheme('dark', root);
    applyTheme('light', root);
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.dataset.theme).toBe('light');
  });

  it('switching theme updates the class without recreating the element', () => {
    const root = document.createElement('html');
    applyTheme('dark', root);
    applyTheme('light', root);
    applyTheme('dark', root);
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.dataset.theme).toBe('dark');
  });
});
