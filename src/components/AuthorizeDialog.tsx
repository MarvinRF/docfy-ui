import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { SecuritySchemeInfo } from '../document-model/types';
import { useTryItStore } from '../state/try-it-store';
import { schemeLabel } from '../lib/security-scheme-label';

export interface AuthorizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  securitySchemes: Record<string, SecuritySchemeInfo>;
}

/**
 * Global "Authorize" dialog — Swagger UI's Authorize button, adapted: one place to enter a value
 * for every security scheme declared anywhere in the spec, instead of per-endpoint. Values live in
 * `try-it-store` (`authValues`), the same store the per-endpoint Try it out panel already reads
 * from, so setting a token here is immediately reused by every request. No login flow — same as
 * upstream Swagger UI, this only accepts a credential you already have, it never fetches one.
 */
export function AuthorizeDialog({ open, onOpenChange, securitySchemes }: AuthorizeDialogProps) {
  const authValues = useTryItStore((s) => s.authValues);
  const setAuthValue = useTryItStore((s) => s.setAuthValue);
  const schemeNames = Object.keys(securitySchemes);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="animate-slide-in fixed top-[12vh] left-1/2 z-[100] w-full max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-warm-lg"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogPrimitive.Title className="text-[13px] font-semibold text-foreground">
              Authorize
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto themed-scroll p-4">
            {schemeNames.length === 0 && (
              <p className="text-[13px] text-muted-foreground">This API doesn't declare any security scheme.</p>
            )}
            {schemeNames.map((name) => {
              const scheme = securitySchemes[name];
              const cookieUnsupported = scheme.type === 'apiKey' && scheme.in === 'cookie';
              return (
                <label key={name} className="flex flex-col gap-1 text-[13px] text-foreground">
                  {schemeLabel(name, scheme)}
                  {cookieUnsupported ? (
                    <span className="text-[11px] text-warning">Cookie auth isn't supported in Try it out.</span>
                  ) : (
                    <input
                      type="text"
                      value={authValues[name] ?? ''}
                      onChange={(e) => setAuthValue(name, e.target.value)}
                      placeholder={scheme.type === 'http' && scheme.scheme === 'basic' ? 'user:pass' : 'value'}
                      className="rounded-md border border-border bg-surface-sunken px-2 py-1.5 font-mono text-[12.5px] text-foreground outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    />
                  )}
                </label>
              );
            })}
          </div>

          <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
            Saved in this browser (localStorage) and reused across every request.
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
