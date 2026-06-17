import { useParams } from 'react-router-dom';
import type { TagGroup } from '../document-model/types';

export interface EndpointPlaceholderProps {
  tagGroups: TagGroup[];
}

/**
 * Phase 3 stand-in for the endpoint detail panel — confirms routing/data
 * wiring works end to end. Full rendering (schemas, parameters, Copy
 * OpenAPI / Copy for AI buttons) is Phase 4 scope.
 */
export function EndpointPlaceholder({ tagGroups }: EndpointPlaceholderProps) {
  const { tag, operationId } = useParams();
  const group = tagGroups.find((g) => g.name === tag);
  const endpoint = group?.endpoints.find((e) => (e.operationId ?? `${e.method}-${e.path}`) === operationId);

  if (!endpoint) {
    return <p style={{ color: 'var(--color-text)' }}>Endpoint not found.</p>;
  }

  return (
    <div style={{ color: 'var(--color-text)' }}>
      <h1 className="text-lg font-semibold">
        {endpoint.method} {endpoint.path}
      </h1>
      {endpoint.summary && <p className="mt-1 opacity-80">{endpoint.summary}</p>}
    </div>
  );
}
