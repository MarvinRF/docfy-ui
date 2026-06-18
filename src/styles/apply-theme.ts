export type ThemeName = 'dark' | 'light';

/**
 * Toggles the `.dark` class (Tailwind v4 `@custom-variant dark`) on the root
 * element. All theming now lives in static CSS custom properties per class
 * (see theme.css `:root` / `.dark`) — no per-theme color computation here.
 */
export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement): void {
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
}
