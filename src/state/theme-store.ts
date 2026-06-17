import { create } from 'zustand';
import { applyTheme } from '../styles/apply-theme';
import type { ThemeName } from '../styles/tokens';

const STORAGE_KEY = 'docfy-ui:theme';

function getInitialTheme(): ThemeName {
  if (typeof localStorage === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: ThemeName = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
