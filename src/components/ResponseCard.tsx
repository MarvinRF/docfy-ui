import type { ResponseInfo } from '../document-model/types';
import { STATUS_TEXT } from '../document-model/example';
import { schemaToTreeNodes } from '../document-model/schema-tree';
import { SchemaTree } from './SchemaTree';

export interface ResponseCardProps {
  response: ResponseInfo;
}

function statusColorVar(status: string): string {
  if (status.startsWith('2')) return '--color-success';
  if (status.startsWith('3')) return '--color-warning';
  if (status.startsWith('4') || status.startsWith('5')) return '--color-destructive';
  return '--color-muted-foreground';
}

/** One response status: code badge, description, content-type, navigable schema. */
export function ResponseCard({ response }: ResponseCardProps) {
  const description = response.description || STATUS_TEXT[response.status];
  const nodes = schemaToTreeNodes(response.schema);
  const colorVar = statusColorVar(response.status);

  return (
    <div
      className="mb-3 rounded-xl border p-3.5 shadow-(--shadow-warm-sm) transition-shadow duration-150 hover:shadow-(--shadow-warm)"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-sunken)' }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="rounded-md px-1.5 py-0.5 font-mono text-xs font-bold ring-1 ring-inset"
          style={{
            color: `var(${colorVar})`,
            backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${colorVar}) 30%, transparent)`,
          }}
        >
          {response.status}
        </span>
        {description && <span className="text-sm" style={{ color: 'var(--color-text)' }}>{description}</span>}
      </div>
      {response.contentType && (
        <p className="mb-2 text-xs opacity-60" style={{ color: 'var(--color-text)' }}>{response.contentType}</p>
      )}
      {nodes.length > 0 && <SchemaTree nodes={nodes} />}
    </div>
  );
}
