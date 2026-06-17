import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyTheme } from './styles/apply-theme';
import { useThemeStore } from './state/theme-store';
import { App } from './App';
import './styles/theme.css';

// Apply the persisted theme synchronously, before first paint, to avoid a flash of the wrong theme.
applyTheme(useThemeStore.getState().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
