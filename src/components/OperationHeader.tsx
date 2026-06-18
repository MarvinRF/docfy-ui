import { ChevronRight } from 'lucide-react';
import type { Endpoint } from '../document-model/types';
import { MethodBadge } from './MethodBadge';

export interface OperationHeaderProps {
  endpoint: Endpoint;
}

/**
 * Breadcrumb (tag) + operation title (summary, falling back to operationId,
 * then path) + method/path chip + description — same structure as the
 * reference's `EndpointPage` header.
 */
export function OperationHeader({ endpoint }: OperationHeaderProps) {
  const title = endpoint.summary ?? endpoint.operationId ?? endpoint.path;
  const tag = endpoint.tags[0];

  return (
    <div>
      {tag && (
        <nav className="mb-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>{tag}</span>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{title}</span>
        </nav>
      )}

      <h1 className="text-balance text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>

      <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-sunken px-3 py-2 font-mono text-[12.5px]">
        <MethodBadge method={endpoint.method} />
        <span className="text-foreground">{endpoint.path}</span>
      </div>

      {endpoint.description && (
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{endpoint.description}</p>
      )}
    </div>
  );
}
