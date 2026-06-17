import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useOpenApiSpec } from './hooks/use-openapi-spec';
import { Shell } from './components/Shell';

/** Default spec URL — the endpoint @nestjs/swagger exposes out of the box. Override with `?spec=<url>`. */
function getSpecUrl(): string {
  if (typeof window === 'undefined') return '/api-json';
  return new URLSearchParams(window.location.search).get('spec') ?? '/api-json';
}

export function App() {
  const specUrl = useMemo(getSpecUrl, []);
  const spec = useOpenApiSpec(specUrl);

  if (spec.status === 'loading') {
    return <CenteredMessage>Loading spec…</CenteredMessage>;
  }

  if (spec.status === 'error') {
    return <CenteredMessage>Failed to load spec from {specUrl}: {spec.error}</CenteredMessage>;
  }

  return (
    <BrowserRouter>
      <Shell tagGroups={spec.data.tagGroups} />
    </BrowserRouter>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center" style={{ color: 'var(--color-text)' }}>
      {children}
    </div>
  );
}
