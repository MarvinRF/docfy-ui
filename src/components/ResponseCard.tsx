import type { ResponseInfo } from '../document-model/types';
import { STATUS_TEXT } from '../document-model/example';
import { schemaToTreeNodes } from '../document-model/schema-tree';
import { SchemaTree } from './SchemaTree';
import { cn } from '../lib/utils';

export interface ResponseCardProps {
  response: ResponseInfo;
}

function statusClasses(status: string): string {
  if (status.startsWith('2')) return 'text-success bg-success/15 ring-success/25';
  if (status.startsWith('3')) return 'text-warning bg-warning/15 ring-warning/30';
  if (status.startsWith('4') || status.startsWith('5')) return 'text-destructive bg-destructive/15 ring-destructive/30';
  return 'text-muted-foreground bg-muted ring-border';
}

/** One response status: code badge, description, content-type, navigable schema. */
export function ResponseCard({ response }: ResponseCardProps) {
  const description = response.description || STATUS_TEXT[response.status];
  const nodes = schemaToTreeNodes(response.schema);

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface-sunken p-3.5 shadow-warm-sm transition-shadow duration-150 hover:shadow-warm">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 font-mono text-xs font-bold ring-1 ring-inset',
            statusClasses(response.status),
          )}
        >
          {response.status}
        </span>
        {description && <span className="text-sm text-foreground">{description}</span>}
      </div>
      {response.contentType && <p className="mb-2 text-xs text-muted-foreground">{response.contentType}</p>}
      {nodes.length > 0 && <SchemaTree nodes={nodes} />}
    </div>
  );
}
