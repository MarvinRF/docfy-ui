import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import type { SecuritySchemeInfo, TagGroup } from '../document-model/types';
import { Sidebar } from './Sidebar';
import { SearchModal } from './SearchModal';
import { EndpointRoute } from './EndpointRoute';
import { EmptyState } from './EmptyState';

// Split out of the main bundle: each pulls its own weight (GuidePage drags in
// react-markdown+remark-gfm; ComparePage drags in the diff engine) and,
// unlike EndpointRoute, neither is where most sessions land first.
const ComparePage = lazy(() => import('./ComparePage').then((m) => ({ default: m.ComparePage })));
const GuidePage = lazy(() => import('./GuidePage').then((m) => ({ default: m.GuidePage })));

export interface ShellProps {
  tagGroups: TagGroup[];
  specUrl: string;
  securitySchemes?: Record<string, SecuritySchemeInfo>;
  servers?: string[];
}

/**
 * Main app layout: sidebar (brand + search trigger + theme toggle + tag
 * tree) + detail panel. Below the `lg` breakpoint the sidebar becomes an
 * off-canvas drawer (hamburger toggle + backdrop) instead of a fixed
 * column. Search is a Cmd/Ctrl+K command palette (`SearchModal`), not an
 * inline filter — matches the reference design's interaction model.
 */
export function Shell({ tagGroups, specUrl, securitySchemes = {}, servers = [] }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex h-full overflow-hidden bg-background text-foreground">
      <Sidebar
        tagGroups={tagGroups}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} tagGroups={tagGroups} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-2 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-foreground transition-colors hover:bg-muted"
          >
            <Menu size={18} />
          </button>
          <span className="font-mono text-[11.5px] text-muted-foreground">Nest Docfy</span>
          <span className="w-7" />
        </div>

        <main className="themed-scroll relative flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            aria-hidden="true"
            className="dot-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-50 mask-[linear-gradient(to_bottom,black,transparent)]"
          />
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route
                path="/guides/:slug"
                element={
                  <GuidePage
                    tagGroups={tagGroups}
                    baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
                    securitySchemes={securitySchemes}
                    servers={servers}
                  />
                }
              />
              <Route
                path="/:tag/:operationId"
                element={<EndpointRoute tagGroups={tagGroups} securitySchemes={securitySchemes} servers={servers} />}
              />
              <Route path="/compare" element={<ComparePage currentSpecUrl={specUrl} />} />
              <Route path="*" element={<EmptyState />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <p className="text-[13px] text-muted-foreground">Loading…</p>
    </div>
  );
}
