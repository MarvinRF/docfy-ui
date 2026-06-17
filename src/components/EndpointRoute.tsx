import { useParams } from 'react-router-dom';
import type { TagGroup } from '../document-model/types';
import { EndpointDetail } from './EndpointDetail';

export interface EndpointRouteProps {
  tagGroups: TagGroup[];
}

/** Resolves the route's :tag/:operationId against the Document Model and renders EndpointDetail. */
export function EndpointRoute({ tagGroups }: EndpointRouteProps) {
  const { tag, operationId } = useParams();
  const group = tagGroups.find((g) => g.name === tag);
  const endpoint = group?.endpoints.find((e) => (e.operationId ?? `${e.method}-${e.path}`) === operationId);

  if (!endpoint) {
    return <p style={{ color: 'var(--color-text)' }}>Endpoint not found.</p>;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return <EndpointDetail endpoint={endpoint} baseUrl={baseUrl} />;
}
