import type { Endpoint } from '../document-model/types';

export interface OperationHeaderProps {
  endpoint: Endpoint;
}

/** Operation title (summary, falling back to operationId, then path) + description. */
export function OperationHeader({ endpoint }: OperationHeaderProps) {
  const title = endpoint.summary ?? endpoint.operationId ?? endpoint.path;

  return (
    <div>
      <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h1>
      {endpoint.description && (
        <p className="mt-1 text-sm opacity-80" style={{ color: 'var(--color-text)' }}>{endpoint.description}</p>
      )}
    </div>
  );
}
