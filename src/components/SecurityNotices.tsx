import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { getHostConfig } from '../lib/host-config';

/**
 * Security misconfigurations detected by the host (`DocfyUiModule.setup()`), shown so the
 * developer sees them before shipping. The host only sends notices outside production, so
 * end users of a deployed docs site never see this banner.
 */
export function SecurityNotices() {
  const notices = getHostConfig().securityNotices ?? [];
  const [dismissed, setDismissed] = useState(false);
  if (notices.length === 0 || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-border bg-warning/12 px-4 py-3 text-[13px] text-foreground"
    >
      <ShieldAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Security configuration needs attention (shown only outside production)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss security notices"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={14} />
      </button>
    </div>
  );
}
