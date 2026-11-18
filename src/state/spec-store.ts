import { create } from 'zustand';
import { getHostConfig } from '../lib/host-config';

export interface SpecOption {
  name: string;
  url: string;
}

export function getConfiguredSpecs(): SpecOption[] {
  return getHostConfig().specs ?? [];
}

/**
 * `?spec=<url>` always wins (explicit override). Otherwise, when multiple
 * specs are configured, default to the first one — so the switcher's
 * initial selection actually matches what's loaded, instead of falling
 * back to `/api-json` and showing a mismatched selection.
 */
export function getInitialUrl(specs: SpecOption[]): string {
  if (typeof window === 'undefined') return '/api-json';
  const override = new URLSearchParams(window.location.search).get('spec');
  if (override) return override;
  return specs[0]?.url ?? '/api-json';
}

interface SpecState {
  specs: SpecOption[];
  currentUrl: string;
  setCurrentUrl: (url: string) => void;
}

export const useSpecStore = create<SpecState>((set) => {
  const specs = getConfiguredSpecs();
  return {
    specs,
    currentUrl: getInitialUrl(specs),
    setCurrentUrl: (url) => set({ currentUrl: url }),
  };
});
