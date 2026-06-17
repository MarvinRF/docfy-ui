import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { TagGroup } from '../document-model/types';
import { MethodBadge } from './MethodBadge';

export interface SidebarProps {
  tagGroups: TagGroup[];
}

function endpointId(endpoint: { method: string; path: string; operationId?: string }): string {
  return endpoint.operationId ?? `${endpoint.method}-${endpoint.path}`;
}

/** Tags rendered as collapsible sections, in the order the Document Model provides them. */
export function Sidebar({ tagGroups }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { operationId: activeOperationId } = useParams();

  function toggle(tagName: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(tagName)) next.delete(tagName);
      else next.add(tagName);
      return next;
    });
  }

  return (
    <nav aria-label="Endpoints" className="themed-scroll h-full overflow-y-auto p-3">
      {tagGroups.map((group) => {
        const isCollapsed = collapsed.has(group.name);
        return (
          <div key={group.name} className="mb-2">
            <button
              type="button"
              onClick={() => toggle(group.name)}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm font-semibold tracking-wide uppercase transition-colors duration-100 hover:bg-white/5"
              style={{ color: 'var(--color-text)' }}
            >
              <span>{group.name}</span>
              <span aria-hidden="true" className={`inline-block transition-transform duration-150 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>▾</span>
            </button>

            {!isCollapsed && (
              <ul className="animate-collapse-in">
                {group.endpoints.map((endpoint) => {
                  const id = endpointId(endpoint);
                  const isActive = id === activeOperationId;
                  return (
                    <li key={`${group.name}-${endpoint.method}-${endpoint.path}`}>
                      <Link
                        to={`/${encodeURIComponent(group.name)}/${encodeURIComponent(id)}`}
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors duration-100"
                        style={{
                          backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                          color: isActive ? '#FFFFFF' : 'var(--color-text)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <MethodBadge method={endpoint.method} />
                        <span className="truncate">{endpoint.path}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
