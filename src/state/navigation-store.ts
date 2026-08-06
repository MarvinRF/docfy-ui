import { create } from 'zustand';

const STORAGE_KEY = 'docfy-ui:navigation';
const MAX_RECENT = 5;

/** `${tag}/${endpointId}` — same shape as the route path Sidebar already links to. */
export type EndpointKey = string;

export function navKeyFor(tag: string, endpointId: string): EndpointKey {
  return `${tag}/${endpointId}`;
}

/** Stable fallback for `favorites[specUrl]`/`recent[specUrl]` lookups — a fresh `[]` per render
 * breaks zustand v5's useSyncExternalStore snapshot comparison (infinite render loop). */
export const EMPTY_KEYS: readonly EndpointKey[] = [];

interface StoredNavigation {
  favorites: Record<string, EndpointKey[]>;
  recent: Record<string, EndpointKey[]>;
}

const EMPTY: StoredNavigation = { favorites: {}, recent: {} };

function load(): StoredNavigation {
  if (typeof localStorage === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredNavigation>;
    return { favorites: parsed.favorites ?? {}, recent: parsed.recent ?? {} };
  } catch {
    return EMPTY;
  }
}

function persist(data: StoredNavigation) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface NavigationState extends StoredNavigation {
  /** Adds/removes `endpointKey` from the favorites list for `specUrl`. Order is insertion order. */
  toggleFavorite: (specUrl: string, endpointKey: EndpointKey) => void;
  isFavorite: (specUrl: string, endpointKey: EndpointKey) => boolean;
  /** Moves `endpointKey` to the front of the recent list for `specUrl`, capped at 5, deduped. */
  recordVisit: (specUrl: string, endpointKey: EndpointKey) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  ...load(),

  toggleFavorite: (specUrl, endpointKey) => {
    const current = get().favorites[specUrl] ?? [];
    const next = current.includes(endpointKey) ? current.filter((k) => k !== endpointKey) : [...current, endpointKey];
    const favorites = { ...get().favorites, [specUrl]: next };
    persist({ favorites, recent: get().recent });
    set({ favorites });
  },

  isFavorite: (specUrl, endpointKey) => (get().favorites[specUrl] ?? []).includes(endpointKey),

  recordVisit: (specUrl, endpointKey) => {
    const current = get().recent[specUrl] ?? [];
    const next = [endpointKey, ...current.filter((k) => k !== endpointKey)].slice(0, MAX_RECENT);
    const recent = { ...get().recent, [specUrl]: next };
    persist({ favorites: get().favorites, recent });
    set({ recent });
  },
}));
