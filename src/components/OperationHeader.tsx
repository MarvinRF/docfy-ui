import { ChevronRight } from 'lucide-react';
import type { Endpoint } from '../document-model/types';

export interface OperationHeaderProps {
  endpoint: Endpoint;
}

/**
 * Breadcrumb (tag) + operation title (summary, falling back to operationId,
 * then path) + description. The method/path chip lives in `RequestPanel`
 * only — repeating it here would duplicate it visually right next to the
 * playground panel on wide screens.
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

      {endpoint.description && (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{endpoint.description}</p>
      )}
    </div>
  );
}
