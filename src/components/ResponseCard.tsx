import type { ResponseInfo } from '../document-model/types';
import { STATUS_TEXT } from '../document-model/example';
import { schemaToTreeNodes } from '../document-model/schema-tree';
import { SchemaTree } from './SchemaTree';

export interface ResponseCardProps {
  response: ResponseInfo;
}

function statusColorClass(status: string): string {
  if (status.startsWith('2')) return 'bg-green-500/15 text-green-400';
  if (status.startsWith('3')) return 'bg-yellow-500/15 text-yellow-400';
  if (status.startsWith('4') || status.startsWith('5')) return 'bg-red-500/15 text-red-400';
  return 'bg-gray-500/15 text-gray-400';
}

/** One response status: code badge, description, content-type, navigable schema. */
export function ResponseCard({ response }: ResponseCardProps) {
  const description = response.description || STATUS_TEXT[response.status];
  const nodes = schemaToTreeNodes(response.schema);

  return (
    <div
      className="mb-3 rounded-lg border p-3 shadow-sm transition-shadow duration-150 hover:shadow-md"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated)' }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${statusColorClass(response.status)}`}>{response.status}</span>
        {description && <span className="text-sm" style={{ color: 'var(--color-text)' }}>{description}</span>}
      </div>
      {response.contentType && (
        <p className="mb-2 text-xs opacity-60" style={{ color: 'var(--color-text)' }}>{response.contentType}</p>
      )}
      {nodes.length > 0 && <SchemaTree nodes={nodes} />}
    </div>
  );
}
