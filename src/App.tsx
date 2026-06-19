import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useOpenApiSpec } from './hooks/use-openapi-spec';
import { Shell } from './components/Shell';

/** Default spec URL — the endpoint @nestjs/swagger exposes out of the box. Override with `?spec=<url>`. */
function getSpecUrl(): string {
  if (typeof window === 'undefined') return '/api-json';
  return new URLSearchParams(window.location.search).get('spec') ?? '/api-json';
}

/**
 * Mount prefix the host server injected via `window.__DOCFY_BASE_PATH__`
 * (see DocfyUiModule.setup). Falls back to '/' when served standalone
 * (e.g. `vite dev`) so BrowserRouter behaves as before in that case.
 */
function getBasename(): string {
  if (typeof window === 'undefined') return '/';
  return window.__DOCFY_BASE_PATH__ ?? '/';
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
    <BrowserRouter basename={getBasename()}>
      <Shell tagGroups={spec.data.tagGroups} />
    </BrowserRouter>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center bg-background px-4 text-foreground">
      <p className="max-w-md text-center text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
