import { useState } from 'react';
import type { ResponseInfo } from '../document-model/types';
import { buildSchemaExample } from '../document-model/example';
import { schemaToTreeNodes } from '../document-model/schema-tree';
import { SchemaTree } from './SchemaTree';

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
      <div
        className={`flex ${CONTENT_HEIGHT} min-w-0 items-center justify-center rounded-2xl border shadow-(--shadow-warm)`}
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated)' }}
      >
        <p className="text-sm opacity-60" style={{ color: 'var(--color-text)' }}>No success response declared.</p>
      </div>
    );
  }

  const example = buildSchemaExample(response.schema);
  const nodes = schemaToTreeNodes(response.schema);

  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl border shadow-(--shadow-warm)"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated)' }}
    >
      <div role="tablist" aria-label="Response viewer" className="flex gap-1 border-b p-2" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors duration-150"
            style={{
              backgroundColor: tab === t ? 'var(--color-accent)' : 'transparent',
              color: tab === t ? '#FFFFFF' : 'var(--color-text)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div key={tab} className={`themed-scroll animate-fade-in ${CONTENT_HEIGHT} overflow-y-auto p-3`}>
        {tab === 'response' ? (
          example ? (
            <pre className="overflow-x-auto text-xs" style={{ color: 'var(--color-text)' }}>
              <code>{example.json}</code>
            </pre>
          ) : (
            <p className="text-sm opacity-60" style={{ color: 'var(--color-text)' }}>No content</p>
          )
        ) : (
          <SchemaTree nodes={nodes} />
        )}
      </div>
    </div>
  );
}
