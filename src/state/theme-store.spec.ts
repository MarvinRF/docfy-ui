// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './theme-store';

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'dark' });
  });

  it('defaults to dark when nothing is stored', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('setTheme updates state and persists to localStorage', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('docfy-ui:theme')).toBe('light');
  });

  it('setTheme applies the CSS variables to <html>', () => {
    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#FFFAF3');
  });

  it('toggleTheme flips between dark and light', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
