import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, Clock, GitCompare, Lock, Moon, Search, Star, Sun, X } from 'lucide-react';
import type { Endpoint, SecuritySchemeInfo, TagGroup } from '../document-model/types';
import { useThemeStore } from '../state/theme-store';
import { useSpecStore } from '../state/spec-store';
import { useTryItStore } from '../state/try-it-store';
import { EMPTY_KEYS, navKeyFor, useNavigationStore } from '../state/navigation-store';
import { getConfiguredGuides } from '../lib/guides';
import { MethodBadge } from './MethodBadge';
import { NestLogo } from './NestLogo';
import { SpecSwitcher } from './SpecSwitcher';
import { AuthorizeDialog } from './AuthorizeDialog';
import { cn } from '../lib/utils';

export interface SidebarProps {
  tagGroups: TagGroup[];
  securitySchemes?: Record<string, SecuritySchemeInfo>;
  /** Mobile off-canvas drawer state — `Shell` owns it, `Sidebar` only renders against it. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSearchOpen: () => void;
}

function endpointId(endpoint: { method: string; path: string; operationId?: string }): string {
  return endpoint.operationId ?? `${endpoint.method}-${endpoint.path}`;
}

/** Same fallback chain as `OperationHeader`'s title — summary, then operationId, then the raw path. */
function endpointTitle(endpoint: { path: string; operationId?: string; summary?: string }): string {
  return endpoint.summary ?? endpoint.operationId ?? endpoint.path;
}

interface EndpointRowProps {
  group: TagGroup;
  endpoint: Endpoint;
  isActive: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCloseMobile: () => void;
}

/** One endpoint link — used by the tag tree, and by the Favorites/Recent sections above it. */
function EndpointRow({ group, endpoint, isActive, isFavorite, onToggleFavorite, onCloseMobile }: EndpointRowProps) {
  const id = endpointId(endpoint);
  const href = `/${encodeURIComponent(group.name)}/${encodeURIComponent(id)}`;
  const title = endpointTitle(endpoint);
  return (
    <li className="group/row">
      <Link
        to={href}
        onClick={onCloseMobile}
        className={cn(
          'relative flex w-full items-center justify-between gap-1.5 rounded-md py-1.5 pr-1.5 pl-3 text-[13px] transition-all duration-200 hover:translate-x-0.5',
          isActive
            ? 'bg-primary/10 font-semibold text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {isActive && (
          <span
            aria-hidden="true"
            data-testid="active-indicator"
            className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-primary"
          />
        )}
        <span className="truncate text-left">{title}</span>
        <span className="flex shrink-0 items-center gap-1">
          <MethodBadge method={endpoint.method} />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            aria-pressed={isFavorite}
            className={cn(
              'rounded p-0.5 text-muted-foreground transition-opacity hover:text-foreground',
              isFavorite ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
            )}
          >
            <Star className={cn('size-3.5', isFavorite && 'fill-primary text-primary')} />
          </button>
        </span>
      </Link>
    </li>
  );
}

/** Brand + search trigger + theme toggle + tag tree + footer — the whole left rail, mirroring the reference design's self-contained Sidebar. */
export function Sidebar({ tagGroups, securitySchemes = {}, mobileOpen, onCloseMobile, onSearchOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [authorizeOpen, setAuthorizeOpen] = useState(false);
  // `useParams()` only sees params from the nearest matching `<Route>` ancestor —
  // Sidebar sits beside `<Routes>`, not inside the `/:tag/:operationId` route, so
  // it would always read `undefined`. Compare the current path instead, which
  // works regardless of where Sidebar lives in the tree.
  const location = useLocation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const guides = getConfiguredGuides();
  const authValues = useTryItStore((s) => s.authValues);
  const hasAuthValue = Object.values(authValues).some((v) => v);

  const specUrl = useSpecStore((s) => s.currentUrl);
  const favoritesBySpec = useNavigationStore((s) => s.favorites);
  const recentBySpec = useNavigationStore((s) => s.recent);
  const toggleFavorite = useNavigationStore((s) => s.toggleFavorite);
  const isFavorite = useNavigationStore((s) => s.isFavorite);
  const clearRecent = useNavigationStore((s) => s.clearRecent);
  const favoriteKeys = favoritesBySpec[specUrl] ?? EMPTY_KEYS;
  const recentKeys = recentBySpec[specUrl] ?? EMPTY_KEYS;

  const endpointByKey = new Map<string, { group: TagGroup; endpoint: Endpoint }>();
  for (const group of tagGroups) {
    for (const endpoint of group.endpoints) {
      endpointByKey.set(navKeyFor(group.name, endpointId(endpoint)), { group, endpoint });
    }
  }
  const favorites = favoriteKeys.map((key) => endpointByKey.get(key)).filter((v) => v !== undefined);
  const recent = recentKeys
    .map((key) => endpointByKey.get(key))
    .filter((v) => v !== undefined)
    .filter((v) => !favoriteKeys.includes(navKeyFor(v.group.name, endpointId(v.endpoint))));

  function toggle(tagName: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(tagName)) next.delete(tagName);
      else next.add(tagName);
      return next;
    });
  }

  /**
   * ↑/↓ moves focus between the sidebar's nav links (Favorites, Recent, Guides, the tag tree,
   * Compare specs), in DOM order — collapsed groups naturally drop out since their `<ul>` isn't
   * rendered. Only acts when focus is already on one of those links, so it can't steal arrow keys
   * meant for something else (e.g. a button). Enter/navigation itself needs no handling — that's
   * native `<a>` behavior.
   */
  function handleNavKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = Array.from(e.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (currentIndex === -1) return;
    e.preventDefault();
    const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
    links[Math.max(0, Math.min(links.length - 1, nextIndex))]?.focus();
  }

  return (
    <>
      {mobileOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="animate-fade-in fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        onKeyDown={handleNavKeyDown}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col border-r border-border bg-surface shadow-warm-lg transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
              <NestLogo className="size-9 text-white dark:text-black" />
            </div>
            <span className="text-[13px] font-semibold tracking-tight">Nest Docfy - Api Reference</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <SpecSwitcher />

        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={onSearchOpen}
            className="group flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface-sunken px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
              ⌘K
            </kbd>
          </button>
          {Object.keys(securitySchemes).length > 0 && (
            <button
              type="button"
              onClick={() => setAuthorizeOpen(true)}
              aria-label="Authorize"
              className={cn(
                'relative grid size-8 shrink-0 place-items-center rounded-lg border transition-colors',
                hasAuthValue
                  ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-border bg-surface-sunken text-foreground hover:border-border-strong hover:bg-muted',
              )}
            >
              <Lock className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-sunken text-foreground transition-colors hover:border-border-strong hover:bg-muted"
          >
            <Sun
              className={cn(
                'absolute size-4 transition-all duration-500',
                theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0',
              )}
            />
            <Moon
              className={cn(
                'absolute size-4 transition-all duration-500',
                theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
              )}
            />
          </button>
        </div>

        {favorites.length > 0 && (
          <nav aria-label="Favorites" className="px-3 pb-2">
            <p className="px-3 pb-1 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Favorites
            </p>
            <ul className="flex flex-col gap-0.5">
              {favorites.map(({ group, endpoint }) => {
                const href = `/${encodeURIComponent(group.name)}/${encodeURIComponent(endpointId(endpoint))}`;
                return (
                  <EndpointRow
                    key={navKeyFor(group.name, endpointId(endpoint))}
                    group={group}
                    endpoint={endpoint}
                    isActive={location.pathname === href}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(specUrl, navKeyFor(group.name, endpointId(endpoint)))}
                    onCloseMobile={onCloseMobile}
                  />
                );
              })}
            </ul>
          </nav>
        )}

        {recent.length > 0 && (
          <nav aria-label="Recently viewed" className="px-3 pb-2">
            <div className="flex items-center justify-between gap-1 px-3 pb-1">
              <p className="flex items-center gap-1 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <Clock aria-hidden="true" className="size-3" />
                Recent
              </p>
              <button
                type="button"
                onClick={() => clearRecent(specUrl)}
                className="text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <ul className="flex flex-col gap-0.5">
              {recent.map(({ group, endpoint }) => {
                const href = `/${encodeURIComponent(group.name)}/${encodeURIComponent(endpointId(endpoint))}`;
                return (
                  <EndpointRow
                    key={navKeyFor(group.name, endpointId(endpoint))}
                    group={group}
                    endpoint={endpoint}
                    isActive={location.pathname === href}
                    isFavorite={false}
                    onToggleFavorite={() => toggleFavorite(specUrl, navKeyFor(group.name, endpointId(endpoint)))}
                    onCloseMobile={onCloseMobile}
                  />
                );
              })}
            </ul>
          </nav>
        )}

        {guides.length > 0 && (
          <nav aria-label="Guides" className="px-3 pb-2">
            <ul className="flex flex-col gap-0.5">
              {guides.map((guide) => {
                const href = `/guides/${encodeURIComponent(guide.slug)}`;
                const isActive = location.pathname === href;
                return (
                  <li key={guide.slug}>
                    <Link
                      to={href}
                      onClick={onCloseMobile}
                      className={cn(
                        'relative flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-all duration-200 hover:translate-x-0.5',
                        isActive
                          ? 'bg-primary/10 font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-primary" />
                      )}
                      <BookOpen className="size-3.5 shrink-0" />
                      <span className="truncate text-left">{guide.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <nav aria-label="Endpoints" className="themed-scroll flex-1 overflow-y-auto px-3 pb-3">
          {tagGroups.map((group) => {
            const isCollapsed = collapsed.has(group.name);
            return (
              <div key={group.name} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggle(group.name)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center justify-between rounded-md px-3 pt-5 pb-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-100 hover:text-foreground"
                >
                  <span>{group.name}</span>
                  <ChevronDown
                    aria-hidden="true"
                    size={13}
                    className={cn('transition-transform duration-150', isCollapsed ? '-rotate-90' : 'rotate-0')}
                  />
                </button>

                {!isCollapsed && (
                  <ul className="animate-collapse-in flex flex-col gap-0.5">
                    {group.endpoints.map((endpoint) => {
                      const id = endpointId(endpoint);
                      const href = `/${encodeURIComponent(group.name)}/${encodeURIComponent(id)}`;
                      const key = navKeyFor(group.name, id);
                      return (
                        <EndpointRow
                          key={key}
                          group={group}
                          endpoint={endpoint}
                          isActive={location.pathname === href}
                          isFavorite={isFavorite(specUrl, key)}
                          onToggleFavorite={() => toggleFavorite(specUrl, key)}
                          onCloseMobile={onCloseMobile}
                        />
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border px-2 py-2">
          <Link
            to="/compare"
            onClick={onCloseMobile}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors',
              location.pathname === '/compare'
                ? 'bg-primary/10 font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <GitCompare className="size-3.5" />
            Compare specs
          </Link>
        </div>

        <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
          <span className="font-mono">$</span> built for Nest Docfy
          <span className="ml-1 inline-block h-2.5 w-1 animate-blink bg-primary align-middle" />
        </div>
      </aside>

      <AuthorizeDialog open={authorizeOpen} onOpenChange={setAuthorizeOpen} securitySchemes={securitySchemes} />
    </>
  );
}
