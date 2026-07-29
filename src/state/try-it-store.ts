import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'docfy-ui:auth-values';

/** Auth values are the one part of try-it-store that persists — see `setAuthValue()` below.
 * Everything else (params/body/results) is intentionally session-only. */
function getInitialAuthValues(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export type TryItResult =
  | { kind: 'success'; status: number; statusText: string; headers: [string, string][]; bodyText: string; durationMs: number }
  | { kind: 'network-error'; message: string };

export interface TryItRequestState {
  paramValues: Record<string, string>;
  bodyText: string | undefined;
  baseUrlOverride: string | undefined;
  loading: boolean;
  result: TryItResult | undefined;
}

const EMPTY_REQUEST_STATE: TryItRequestState = {
  paramValues: {},
  bodyText: undefined,
  baseUrlOverride: undefined,
  loading: false,
  result: undefined,
};

interface TryItState {
  /** Auth credential values keyed by security scheme name — global, reused across endpoints (mirrors
   * a real dev token). Persisted to localStorage (unlike the rest of this store) so it survives a
   * reload — the one deliberate exception to "Try it out state is session-only". */
  authValues: Record<string, string>;
  setAuthValue: (scheme: string, value: string) => void;

  /** Per-endpoint request/response state, keyed by `${method} ${path}`. */
  requests: Record<string, TryItRequestState>;
  setParamValue: (endpointKey: string, name: string, value: string) => void;
  setBodyText: (endpointKey: string, text: string) => void;
  setBaseUrlOverride: (endpointKey: string, url: string) => void;
  setLoading: (endpointKey: string, loading: boolean) => void;
  setResult: (endpointKey: string, result: TryItResult | undefined) => void;
}

export function endpointKeyFor(endpoint: { method: string; path: string }): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function getRequestState(state: TryItState, endpointKey: string): TryItRequestState {
  return state.requests[endpointKey] ?? EMPTY_REQUEST_STATE;
}

export const useTryItStore = create<TryItState>((set, get) => ({
  authValues: getInitialAuthValues(),
  setAuthValue: (scheme, value) => {
    const authValues = { ...get().authValues, [scheme]: value };
    if (typeof localStorage !== 'undefined') localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authValues));
    set({ authValues });
  },

  requests: {},
  setParamValue: (endpointKey, name, value) => {
    const current = getRequestState(get(), endpointKey);
    set((state) => ({
      requests: {
        ...state.requests,
        [endpointKey]: { ...current, paramValues: { ...current.paramValues, [name]: value } },
      },
    }));
  },
  setBodyText: (endpointKey, text) => {
    const current = getRequestState(get(), endpointKey);
    set((state) => ({ requests: { ...state.requests, [endpointKey]: { ...current, bodyText: text } } }));
  },
  setBaseUrlOverride: (endpointKey, url) => {
    const current = getRequestState(get(), endpointKey);
    set((state) => ({ requests: { ...state.requests, [endpointKey]: { ...current, baseUrlOverride: url } } }));
  },
  setLoading: (endpointKey, loading) => {
    const current = getRequestState(get(), endpointKey);
    set((state) => ({ requests: { ...state.requests, [endpointKey]: { ...current, loading } } }));
  },
  setResult: (endpointKey, result) => {
    const current = getRequestState(get(), endpointKey);
    set((state) => ({ requests: { ...state.requests, [endpointKey]: { ...current, result } } }));
  },
}));

/** Selector helper — always returns a defined state, never `undefined`, for a given endpoint. */
export function useTryItRequestState(endpointKey: string): TryItRequestState {
  return useTryItStore((state) => state.requests[endpointKey] ?? EMPTY_REQUEST_STATE);
}
