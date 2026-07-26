import { useState, type FormEvent } from 'react';
import { normalizeDocument } from '../document-model/normalize';
import { diffDocuments, type SpecDiff, type ChangedEndpoint } from '../document-model/diff';
import type { Endpoint } from '../document-model/types';
import { MethodBadge } from './MethodBadge';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export interface ComparePageProps {
  /** Prefills the "New spec" field with the spec currently loaded in the app. */
  currentSpecUrl: string;
}

type CompareState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; diff: SpecDiff };

async function fetchAndNormalize(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  return normalizeDocument(await res.json());
}

function breakingCount(diff: SpecDiff): number {
  const fromChanges = diff.changed.reduce(
    (n, c) => n + c.changes.filter((ch) => ch.severity === 'breaking').length,
    0,
  );
  return diff.removed.length + fromChanges;
}

function EndpointRow({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <MethodBadge method={endpoint.method} />
      <span className="truncate font-mono text-[13px] text-foreground">{endpoint.path}</span>
    </div>
  );
}

function ChangedEndpointCard({ entry }: { entry: ChangedEndpoint }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <MethodBadge method={entry.method} />
        <span className="truncate font-mono text-[13px] text-foreground">{entry.path}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {entry.changes.map((change, i) => (
          <li key={i} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <Badge variant={change.severity === 'breaking' ? 'destructive' : 'info'}>
              {change.severity}
            </Badge>
            {change.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiffResults({ diff }: { diff: SpecDiff }) {
  const breaking = breakingCount(diff);
  const isEmpty = diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0;

  if (isEmpty) {
    return <p className="text-sm text-muted-foreground">No differences found — the two specs match.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        <Badge variant={breaking > 0 ? 'destructive' : 'success'}>
          {breaking} breaking change{breaking === 1 ? '' : 's'}
        </Badge>
        {' · '}
        {diff.added.length} added · {diff.changed.length} changed · {diff.removed.length} removed
      </p>

      {diff.removed.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Removed endpoints <span className="text-destructive">(breaking)</span>
          </h2>
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border px-3">
            {diff.removed.map((e) => (
              <EndpointRow key={`${e.method} ${e.path}`} endpoint={e} />
            ))}
          </div>
        </section>
      )}

      {diff.changed.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Changed endpoints</h2>
          <div className="flex flex-col gap-2">
            {diff.changed.map((c) => (
              <ChangedEndpointCard key={`${c.method} ${c.path}`} entry={c} />
            ))}
          </div>
        </section>
      )}

      {diff.added.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Added endpoints</h2>
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border px-3">
            {diff.added.map((e) => (
              <EndpointRow key={`${e.method} ${e.path}`} endpoint={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Compares two OpenAPI specs (fetched by URL) and reports what changed
 * between them — added/removed/changed endpoints, each change flagged as
 * breaking or informational. Reuses the same normalizeDocument() pipeline
 * the main viewer uses, so this never re-implements OpenAPI parsing.
 */
export function ComparePage({ currentSpecUrl }: ComparePageProps) {
  const [oldUrl, setOldUrl] = useState('');
  const [newUrl, setNewUrl] = useState(currentSpecUrl);
  const [state, setState] = useState<CompareState>({ status: 'idle' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ status: 'loading' });
    try {
      const [oldModel, newModel] = await Promise.all([
        fetchAndNormalize(oldUrl),
        fetchAndNormalize(newUrl),
      ]);
      setState({ status: 'success', diff: diffDocuments(oldModel, newModel) });
    } catch (err) {
      setState({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="animate-fade-in-up mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Compare specs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detects breaking changes between two OpenAPI documents — paste a URL for each (e.g. a
          previous release's <code className="font-mono">/api-json</code> vs. the current one).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          Base spec (old)
          <input
            required
            value={oldUrl}
            onChange={(e) => setOldUrl(e.target.value)}
            placeholder="https://old-deploy.example.com/api-json"
            className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          New spec
          <input
            required
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="/api-json"
            className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:border-primary"
          />
        </label>
        <Button type="submit" className="self-start" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Comparing…' : 'Compare'}
        </Button>
      </form>

      {state.status === 'error' && <p className="text-sm text-destructive">{state.error}</p>}
      {state.status === 'success' && <DiffResults diff={state.diff} />}
    </div>
  );
}
