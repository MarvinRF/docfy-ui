import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { SecuritySchemeInfo, TagGroup } from '../document-model/types';
import { useSpecStore } from '../state/spec-store';
import { navKeyFor, useNavigationStore } from '../state/navigation-store';
import { EndpointDetail } from './EndpointDetail';

export interface EndpointRouteProps {
  tagGroups: TagGroup[];
  securitySchemes?: Record<string, SecuritySchemeInfo>;
  servers?: string[];
}

/** Resolves the route's :tag/:operationId against the Document Model and renders EndpointDetail. */
export function EndpointRoute({ tagGroups, securitySchemes = {}, servers = [] }: EndpointRouteProps) {
  const { tag, operationId } = useParams();
  const group = tagGroups.find((g) => g.name === tag);
  const endpoint = group?.endpoints.find((e) => (e.operationId ?? `${e.method}-${e.path}`) === operationId);
  const specUrl = useSpecStore((s) => s.currentUrl);
  const recordVisit = useNavigationStore((s) => s.recordVisit);

  useEffect(() => {
    if (tag && operationId) recordVisit(specUrl, navKeyFor(tag, operationId));
  }, [specUrl, tag, operationId, recordVisit]);

  if (!endpoint) {
    return <p className="text-foreground">Endpoint not found.</p>;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return <EndpointDetail endpoint={endpoint} baseUrl={baseUrl} securitySchemes={securitySchemes} servers={servers} />;
}
