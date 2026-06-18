import { useState } from 'react';
import type { ResponseInfo } from '../document-model/types';
import { buildSchemaExample } from '../document-model/example';
import { schemaToTreeNodes } from '../document-model/schema-tree';
import { SchemaTree } from './SchemaTree';
import { CodeBlock } from './CodeBlock';
import { cn } from '../lib/utils';

export interface ResponseViewerProps {
  response: ResponseInfo | undefined;
}

type Tab = 'response' | 'schema';
const TABS: Tab[] = ['response', 'schema'];

/** Fixed content height — long bodies/schemas scroll instead of pushing the layout around. */
const CONTENT_HEIGHT = 'h-80';

/**
 * Tabbed Response/Schema view for the primary success response. No
 * "Headers" tab — OpenAPI response headers aren't extracted by the
 * Document Model yet (Phase 1 didn't need them); adding it is a
 * follow-up, not a silent gap.
 */
export function ResponseViewer({ response }: ResponseViewerProps) {
  const [tab, setTab] = useState<Tab>('response');

  if (!response) {
    return (
      <div className="flex h-80 min-w-0 items-center justify-center rounded-2xl border border-border bg-surface-elevated shadow-warm">
        <p className="text-sm text-muted-foreground">No success response declared.</p>
      </div>
    );
  }

  const example = buildSchemaExample(response.schema);
  const nodes = schemaToTreeNodes(response.schema);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-warm">
      <div role="tablist" aria-label="Response viewer" className="flex gap-1 border-b border-border p-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors duration-150',
              tab === t ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div key={tab} className={cn('themed-scroll animate-fade-in overflow-y-auto', CONTENT_HEIGHT, tab === 'response' ? '' : 'p-3')}>
        {tab === 'response' ? (
          example ? (
            <CodeBlock code={example.json} language="json" variant="inline" showCopy={false} className="rounded-none ring-0" />
          ) : (
            <p className="p-3 text-sm text-muted-foreground">No content</p>
          )
        ) : (
          <SchemaTree nodes={nodes} />
        )}
      </div>
    </div>
  );
}
