import { useState } from 'react';
import type { ResponseInfo } from '../document-model/types';
import { buildSchemaExample, pickPrimarySuccessResponse } from '../document-model/example';
import { CodeBlock } from './CodeBlock';
import { cn } from '../lib/utils';

export interface ResponseViewerProps {
  responses: ResponseInfo[];
}

function statusClasses(status: string): string {
  if (status.startsWith('2')) return 'bg-success/15 text-success';
  if (status.startsWith('4')) return 'bg-warning/15 text-warning';
  if (status.startsWith('5')) return 'bg-destructive/15 text-destructive';
  return 'bg-muted text-foreground';
}

/**
 * Mirrors the reference's `RightPanel` response card exactly: a "Response"
 * label on the left, one tab per declared status on the right (colored by
 * status range when selected), single `CodeBlock` body below. Defaults to
 * the primary success status, same as before this took the full list.
 */
export function ResponseViewer({ responses }: ResponseViewerProps) {
  const defaultStatus = pickPrimarySuccessResponse(responses)?.status ?? responses[0]?.status;
  const [status, setStatus] = useState<string | undefined>(defaultStatus);

  const active = responses.find((r) => r.status === status) ?? responses[0];

  if (!active) {
    return (
      <div className="flex h-40 min-w-0 items-center justify-center rounded-2xl border border-border bg-surface shadow-warm">
        <p className="text-sm text-muted-foreground">No responses declared.</p>
      </div>
    );
  }

  const example = buildSchemaExample(active.schema);
  const code = example ? example.json : `// ${active.status} — No Content`;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-warm">
      <div className="flex items-center gap-1 border-b border-border bg-surface-sunken px-2 py-1.5">
        <span className="px-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Response</span>
        <div className="ml-auto flex items-center gap-1">
          {responses.map((r) => (
            <button
              key={r.status}
              type="button"
              onClick={() => setStatus(r.status)}
              className={cn(
                'rounded-md px-2 py-1 font-mono text-[11px] transition-colors',
                r.status === active.status ? statusClasses(r.status) : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {r.status}
            </button>
          ))}
        </div>
      </div>
      <div key={active.status} className="animate-fade-in-up">
        <CodeBlock code={code} language="json" variant="inline" showCopy className="rounded-none ring-0" />
      </div>
    </div>
  );
}
