import type { SecuritySchemeInfo } from '../document-model/types';
import { useTryItStore } from '../state/try-it-store';
import { schemeLabel } from '../lib/security-scheme-label';

export interface AuthPanelProps {
  security: Record<string, string[]>[];
  securitySchemes: Record<string, SecuritySchemeInfo>;
}

/**
 * Renders one input per distinct security scheme referenced by the endpoint's
 * `security` requirements. Auth values are global (`try-it-store`), not
 * per-endpoint — the same credential is reused across endpoints, same as a
 * real dev token would be.
 */
export function AuthPanel({ security, securitySchemes }: AuthPanelProps) {
  const authValues = useTryItStore((s) => s.authValues);
  const setAuthValue = useTryItStore((s) => s.setAuthValue);

  const schemeNames = Array.from(new Set(security.flatMap((req) => Object.keys(req))));
  if (schemeNames.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-white/10 p-3">
      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-terminal-fg/55">
        Authorization <span className="normal-case font-normal text-terminal-fg/40">— saved in this browser</span>
      </h4>
      {schemeNames.map((name) => {
        const scheme = securitySchemes[name];
        if (!scheme) return null;
        const cookieUnsupported = scheme.type === 'apiKey' && scheme.in === 'cookie';
        return (
          <label key={name} className="flex flex-col gap-1 text-xs text-terminal-fg/80">
            {schemeLabel(name, scheme)}
            {cookieUnsupported ? (
              <span className="text-[11px] text-warning">Cookie auth isn't supported in Try it out.</span>
            ) : (
              <input
                type="text"
                value={authValues[name] ?? ''}
                onChange={(e) => setAuthValue(name, e.target.value)}
                placeholder={scheme.type === 'http' && scheme.scheme === 'basic' ? 'user:pass' : 'value'}
                className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-terminal-fg outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
