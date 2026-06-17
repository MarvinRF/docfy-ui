import { useEffect, useState } from 'react';
import { normalizeDocument } from '../document-model/normalize';
import type { DocumentModel } from '../document-model/types';

export type SpecState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: DocumentModel };

/**
 * Fetches an OpenAPI JSON spec from `url` (same-origin by default — e.g.
 * the `/api-json` endpoint @nestjs/swagger already exposes) and
 * normalizes it into the Document Model. Re-fetches whenever `url`
 * changes.
 */
export function useOpenApiSpec(url: string): SpecState {
  const [state, setState] = useState<SpecState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((raw) => normalizeDocument(raw))
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', error: err instanceof Error ? err.message : String(err) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
