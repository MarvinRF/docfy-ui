import { getThemeTokens, STATUS_TOKENS, type ThemeName } from './tokens';

/**
 * Applies a theme's CSS custom properties to `<html>` and sets
 * `data-theme`. No reload, no React re-render needed for components that
 * reference the variables via CSS — only the variable values change.
 */
export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement): void {
  const tokens = getThemeTokens(theme);
  root.dataset.theme = theme;
  root.style.setProperty('--color-bg', tokens.bg);
  root.style.setProperty('--color-text', tokens.text);
  root.style.setProperty('--color-accent', tokens.accent);
  root.style.setProperty('--color-bg-elevated', tokens.bgElevated);
  root.style.setProperty('--color-border', tokens.border);
  root.style.setProperty('--color-surface-sunken', tokens.surfaceSunken);
  root.style.setProperty('--color-border-strong', tokens.borderStrong);
  root.style.setProperty('--color-muted-foreground', tokens.mutedForeground);
  for (const [key, value] of Object.entries(STATUS_TOKENS)) {
    const cssName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssName, value);
  }
}
