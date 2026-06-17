import { useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { TagGroup } from '../document-model/types';
import { filterTagGroups } from '../document-model/filter';
import { useThemeStore } from '../state/theme-store';
import { Sidebar } from './Sidebar';
import { SearchInput } from './SearchInput';
import { EndpointRoute } from './EndpointRoute';
import { EmptyState } from './EmptyState';

export interface ShellProps {
  tagGroups: TagGroup[];
}

/**
 * Main app layout: sidebar (search + tag tree) + detail panel.
 * Below the `lg` breakpoint the sidebar becomes an off-canvas drawer
 * (hamburger toggle + backdrop) instead of a fixed column.
 */
export function Shell({ tagGroups }: ShellProps) {
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filtered = useMemo(() => filterTagGroups(tagGroups, query), [tagGroups, query]);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="relative flex h-full overflow-hidden">
      {sidebarOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="animate-fade-in fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col border-r shadow-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated)' }}
      >
        <div className="p-3">
          <SearchInput value={query} onChange={setQuery} />
        </div>
        <Sidebar tagGroups={filtered} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between gap-2 border-b p-3"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded p-1.5 transition-opacity hover:opacity-70 lg:hidden"
            style={{ color: 'var(--color-text)' }}
          >
            ☰
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded px-3 py-1 text-sm transition-opacity hover:opacity-80 active:scale-95"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </header>

        <main className="themed-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route path="/:tag/:operationId" element={<EndpointRoute tagGroups={tagGroups} />} />
            <Route path="*" element={<EmptyState />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
