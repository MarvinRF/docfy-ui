import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ResponseInfo } from '../document-model/types';
import { STATUS_TEXT, buildSchemaExample } from '../document-model/example';
import { CodeBlock } from './CodeBlock';
import { cn } from '../lib/utils';

export interface ResponseCardProps {
  response: ResponseInfo;
  defaultOpen?: boolean;
}

function statusClasses(status: string): string {
  if (status.startsWith('2')) return 'text-success bg-success/12 ring-success/25';
  if (status.startsWith('4')) return 'text-warning bg-warning/15 ring-warning/30';
  if (status.startsWith('5')) return 'text-destructive bg-destructive/15 ring-destructive/30';
  return 'text-muted-foreground bg-muted ring-border';
}

/**
 * Collapsible response row — status pill, label, JSON body — mirrors the
 * reference's `ResponseRow` exactly: chevron rotates open, body expands via
 * a `grid-template-rows` transition, body rendered through `CodeBlock`.
 */
export function ResponseCard({ response, defaultOpen }: ResponseCardProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const label = response.description || STATUS_TEXT[response.status];
  const example = buildSchemaExample(response.schema);
  const code = example ? example.json : '// No content';

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <ChevronRight className={cn('size-4 text-muted-foreground transition-transform duration-300', open && 'rotate-90')} />
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-inset',
            statusClasses(response.status),
          )}
        >
          {response.status}
        </span>
        {label && <span className="text-[13.5px] text-foreground">{label}</span>}
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <CodeBlock code={code} language="json" variant="inline" showCopy />
          </div>
        </div>
      </div>
    </div>
  );
}
