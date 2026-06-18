import type { Endpoint } from '../document-model/types';

export interface OperationHeaderProps {
  endpoint: Endpoint;
}

/** Operation title (summary, falling back to operationId, then path) + description. */
export function OperationHeader({ endpoint }: OperationHeaderProps) {
  const title = endpoint.summary ?? endpoint.operationId ?? endpoint.path;

  return (
    <div>
      <h1
        className="text-[28px] font-semibold leading-tight tracking-tight text-balance"
        style={{ color: 'var(--color-text)' }}
      >
        {title}
      </h1>
      {endpoint.description && (
        <p className="mt-2 text-[15px] leading-relaxed opacity-80" style={{ color: 'var(--color-text)' }}>
          {endpoint.description}
        </p>
      )}
    </div>
  );
}
