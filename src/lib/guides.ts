export interface GuideOption {
  slug: string;
  title: string;
  content: string;
}

/** Static for the lifetime of the page load (unlike `spec-store.ts`'s specs, there's no
 * switcher/interactive state to manage here) — read directly off `window`, no store needed. */
export function getConfiguredGuides(): GuideOption[] {
  if (typeof window === 'undefined') return [];
  return window.__DOCFY_GUIDES__ ?? [];
}
