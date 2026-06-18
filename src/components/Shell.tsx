import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import type { TagGroup } from '../document-model/types';
import { Sidebar } from './Sidebar';
import { SearchModal } from './SearchModal';
import { EndpointRoute } from './EndpointRoute';
import { EmptyState } from './EmptyState';

export interface ShellProps {
  tagGroups: TagGroup[];
}

/**
 * Main app layout: sidebar (brand + search trigger + theme toggle + tag
 * tree) + detail panel. Below the `lg` breakpoint the sidebar becomes an
 * off-canvas drawer (hamburger toggle + backdrop) instead of a fixed
 * column. Search is a Cmd/Ctrl+K command palette (`SearchModal`), not an
 * inline filter — matches the reference design's interaction model.
 */
export function Shell({ tagGroups }: ShellProps) {
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
          <span className="font-mono text-[11.5px] text-muted-foreground">docfy</span>
          <span className="w-7" />
        </div>

        <main className="themed-scroll relative flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            aria-hidden="true"
            className="dot-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-50 mask-[linear-gradient(to_bottom,black,transparent)]"
          />
          <Routes>
            <Route path="/:tag/:operationId" element={<EndpointRoute tagGroups={tagGroups} />} />
            <Route path="*" element={<EmptyState />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
