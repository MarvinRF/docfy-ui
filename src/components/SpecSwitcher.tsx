import { ChevronDown } from 'lucide-react';
import { useSpecStore } from '../state/spec-store';

/**
 * Lets a user switch which OpenAPI spec is loaded, when the host configured
 * more than one via `DocfyUiModule.setup(mountPath, app, { specs })`.
 * Renders nothing otherwise — single-spec setups are unaffected.
 */
export function SpecSwitcher() {
  const specs = useSpecStore((s) => s.specs);
  const currentUrl = useSpecStore((s) => s.currentUrl);
  const setCurrentUrl = useSpecStore((s) => s.setCurrentUrl);

  if (specs.length < 2) return null;

  return (
    <div className="relative px-4 pb-3">
      <select
        aria-label="Switch spec"
        value={currentUrl}
        onChange={(e) => setCurrentUrl(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-surface-sunken px-2.5 py-1.5 pr-7 text-[12.5px] text-foreground outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {specs.map((spec) => (
          <option key={spec.url} value={spec.url}>
            {spec.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
