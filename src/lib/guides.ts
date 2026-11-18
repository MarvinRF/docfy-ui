import { getHostConfig } from './host-config';

export interface GuideOption {
  slug: string;
  title: string;
  content: string;
}

/** Static for the lifetime of the page load (unlike `spec-store.ts`'s specs, there's no
 * switcher/interactive state to manage here) — read straight from the host config, no store needed. */
export function getConfiguredGuides(): GuideOption[] {
  return getHostConfig().guides ?? [];
}
