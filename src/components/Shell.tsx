import { useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { TagGroup } from '../document-model/types';
import { filterTagGroups } from '../document-model/filter';
import { useThemeStore } from '../state/theme-store';
import { Sidebar } from './Sidebar';
import { SearchInput } from './SearchInput';
import { EndpointPlaceholder } from './EndpointPlaceholder';
import { EmptyState } from './EmptyState';

export interface ShellProps {
  tagGroups: TagGroup[];
}

/** Main app layout: sidebar (search + tag tree) on the left, detail panel on the right. */
export function Shell({ tagGroups }: ShellProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterTagGroups(tagGroups, query), [tagGroups, query]);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="grid h-full grid-cols-[280px_1fr]">
      <aside className="flex h-full flex-col border-r" style={{ borderColor: 'var(--color-border)' }}>
        <div className="p-3">
          <SearchInput value={query} onChange={setQuery} />
        </div>
        <Sidebar tagGroups={filtered} />
      </aside>

      <main className="overflow-y-auto p-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded px-3 py-1 text-sm"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        <Routes>
          <Route path="/:tag/:operationId" element={<EndpointPlaceholder tagGroups={tagGroups} />} />
          <Route path="*" element={<EmptyState />} />
        </Routes>
      </main>
    </div>
  );
}
