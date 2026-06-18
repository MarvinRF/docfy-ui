import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Hexagon, Moon, Search, Sun, X } from "lucide-react";
import type { TagGroup } from "../document-model/types";
import { useThemeStore } from "../state/theme-store";
import { MethodBadge } from "./MethodBadge";
import { cn } from "../lib/utils";

export interface SidebarProps {
  tagGroups: TagGroup[];
  /** Mobile off-canvas drawer state — `Shell` owns it, `Sidebar` only renders against it. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSearchOpen: () => void;
}

function endpointId(endpoint: {
  method: string;
  path: string;
  operationId?: string;
}): string {
  return endpoint.operationId ?? `${endpoint.method}-${endpoint.path}`;
}

/** Same fallback chain as `OperationHeader`'s title — summary, then operationId, then the raw path. */
function endpointTitle(endpoint: {
  path: string;
  operationId?: string;
  summary?: string;
}): string {
  return endpoint.summary ?? endpoint.operationId ?? endpoint.path;
}

/** Brand + search trigger + theme toggle + tag tree + footer — the whole left rail, mirroring the reference design's self-contained Sidebar. */
export function Sidebar({
  tagGroups,
  mobileOpen,
  onCloseMobile,
  onSearchOpen,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // `useParams()` only sees params from the nearest matching `<Route>` ancestor —
  // Sidebar sits beside `<Routes>`, not inside the `/:tag/:operationId` route, so
  // it would always read `undefined`. Compare the current path instead, which
  // works regardless of where Sidebar lives in the tree.
  const location = useLocation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  function toggle(tagName: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(tagName)) next.delete(tagName);
      else next.add(tagName);
      return next;
    });
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
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col border-r border-border bg-surface shadow-warm-lg transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
              <Hexagon className="size-4" strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold tracking-tight">
              Docfy - Api Reference
            </span>
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
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-sunken text-foreground transition-colors hover:border-border-strong hover:bg-muted"
          >
            <Sun
              className={cn(
                "absolute size-4 transition-all duration-500",
                theme === "light"
                  ? "rotate-0 opacity-100"
                  : "rotate-90 opacity-0",
              )}
            />
            <Moon
              className={cn(
                "absolute size-4 transition-all duration-500",
                theme === "dark"
                  ? "rotate-0 opacity-100"
                  : "-rotate-90 opacity-0",
              )}
            />
          </button>
        </div>

        <nav
          aria-label="Endpoints"
          className="themed-scroll flex-1 overflow-y-auto px-3 pb-3"
        >
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
                    className={cn(
                      "transition-transform duration-150",
                      isCollapsed ? "-rotate-90" : "rotate-0",
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <ul className="animate-collapse-in flex flex-col gap-0.5">
                    {group.endpoints.map((endpoint) => {
                      const id = endpointId(endpoint);
                      const href = `/${encodeURIComponent(group.name)}/${encodeURIComponent(id)}`;
                      const isActive = location.pathname === href;
                      return (
                        <li
                          key={`${group.name}-${endpoint.method}-${endpoint.path}`}
                        >
                          <Link
                            to={href}
                            onClick={onCloseMobile}
                            className={cn(
                              "relative flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-[13px] transition-all duration-200 hover:translate-x-0.5",
                              isActive
                                ? "bg-primary/10 font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-primary"
                              />
                            )}
                            <span className="truncate text-left">
                              {endpointTitle(endpoint)}
                            </span>
                            <MethodBadge method={endpoint.method} />
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

        <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
          <span className="font-mono">$</span> built for Nest Docfy
          <span className="ml-1 inline-block h-2.5 w-1 animate-blink bg-primary align-middle" />
        </div>
      </aside>
    </>
  );
}
