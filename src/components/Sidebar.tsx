import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { TagGroup } from '../document-model/types';
import { MethodBadge } from './MethodBadge';

export interface SidebarProps {
  tagGroups: TagGroup[];
  /** Called when an endpoint link is clicked — Shell uses this to close the mobile drawer on navigation. */
  onNavigate?: () => void;
}

function endpointId(endpoint: { method: string; path: string; operationId?: string }): string {
  return endpoint.operationId ?? `${endpoint.method}-${endpoint.path}`;
}

/** Tags rendered as collapsible sections, in the order the Document Model provides them. */
export function Sidebar({ tagGroups, onNavigate }: SidebarProps) {
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
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors duration-100"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <span>{group.name}</span>
              <ChevronDown
                aria-hidden="true"
                size={13}
                className={`transition-transform duration-150 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
              />
            </button>

            {!isCollapsed && (
              <ul className="animate-collapse-in">
                {group.endpoints.map((endpoint) => {
                  const id = endpointId(endpoint);
                  const isActive = id === activeOperationId;
                  return (
                    <li key={`${group.name}-${endpoint.method}-${endpoint.path}`} className="relative">
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                          style={{ backgroundColor: 'var(--color-accent)' }}
                        />
                      )}
                      <Link
                        to={`/${encodeURIComponent(group.name)}/${encodeURIComponent(id)}`}
                        onClick={onNavigate}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-all duration-100 hover:translate-x-0.5"
                        style={{
                          backgroundColor: isActive ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                          color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
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
