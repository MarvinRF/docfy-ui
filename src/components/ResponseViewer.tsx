import { useEffect, useMemo, useState } from 'react';
import type { ResponseInfo, SecuritySchemeInfo } from '../document-model/types';
import { buildSchemaExample, pickPrimarySuccessResponse, validateAgainstSchema } from '../document-model/example';
import type { SchemaMismatch } from '../document-model/example';
import { useTryItRequestState, useTryItStore } from '../state/try-it-store';
import { findBearerSchemeName, findLikelyToken } from '../transformers/extract-token';
import { CodeBlock } from './CodeBlock';
import { cn } from '../lib/utils';

export interface ResponseViewerProps {
  responses: ResponseInfo[];
  /** `${method} ${path}` for the current endpoint — when given and a live result exists
   * in try-it-store, a "Live" tab appears alongside the declared status tabs. */
  endpointKey?: string;
  /** All security schemes declared by the document — when given, a successful Live response
   * containing a token-shaped field offers a one-click "Use as ... token" button. */
  securitySchemes?: Record<string, SecuritySchemeInfo>;
}

const LIVE_TAB = 'live';

/** Pretty-prints a live response body when it's valid JSON; returns it unchanged otherwise
 * (e.g. plain text, HTML, or already-empty bodies) rather than showing raw compact JSON. */
function formatResponseBody(bodyText: string): string {
  try {
    return JSON.stringify(JSON.parse(bodyText), null, 2);
  } catch {
    return bodyText;
  }
}

interface UseTokenButtonProps {
  schemeName: string;
  token: string;
}

/** One-click "log in, then use the returned token" — sets the token in try-it-store under the
 * matched scheme name, same place `AuthPanel` reads/writes it. */
function UseTokenButton({ schemeName, token }: UseTokenButtonProps) {
  const setAuthValue = useTryItStore((s) => s.setAuthValue);
  const [used, setUsed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setAuthValue(schemeName, token);
        setUsed(true);
        setTimeout(() => setUsed(false), 1500);
      }}
      className={cn(
        'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
        used ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary hover:bg-primary/20',
      )}
    >
      {used ? 'Used!' : `Use as ${schemeName} token`}
    </button>
  );
}

interface SchemaMatchBadgeProps {
  mismatches: SchemaMismatch[];
}

/** Shown only when there was something to check (a declared schema + a parsed JSON body) —
 * green "matches schema" or red "N mismatches" with each offending path/reason on hover. */
function SchemaMatchBadge({ mismatches }: SchemaMatchBadgeProps) {
  if (mismatches.length === 0) {
    return (
      <span className="rounded-md bg-success/15 px-2 py-1 text-[11px] font-medium text-success">
        ✓ Matches schema
      </span>
    );
  }
  const title = mismatches.map((m) => `${m.path}: ${m.message}`).join('\n');
  return (
    <span
      title={title}
      className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-medium text-destructive"
    >
      ⚠ {mismatches.length} schema mismatch{mismatches.length === 1 ? '' : 'es'}
    </span>
  );
}

function statusClasses(status: string): string {
  if (status.startsWith('2')) return 'bg-success/15 text-success';
  if (status.startsWith('4')) return 'bg-warning/15 text-warning';
  if (status.startsWith('5')) return 'bg-destructive/15 text-destructive';
  return 'bg-muted text-foreground';
}

/**
 * Mirrors the reference's `RightPanel` response card exactly: a "Response"
 * label on the left, one tab per declared status on the right (colored by
 * status range when selected), single `CodeBlock` body below. Defaults to
 * the primary success status, same as before this took the full list.
 */
export function ResponseViewer({ responses, endpointKey, securitySchemes = {} }: ResponseViewerProps) {
  const liveResult = useTryItRequestState(endpointKey ?? '').result;
  const defaultStatus = pickPrimarySuccessResponse(responses)?.status ?? responses[0]?.status;
  const [status, setStatus] = useState<string>(defaultStatus ?? LIVE_TAB);

  // Jump to the "Live" tab whenever a fresh result comes back from Try it out.
  useEffect(() => {
    if (liveResult) setStatus(LIVE_TAB);
  }, [liveResult]);

  // Structural drift check: does the live body actually match the schema this status
  // code promises? `undefined` means "nothing to check" (non-JSON body, no declared
  // schema for this status, or no live result yet) — distinct from "checked, 0 issues".
  const schemaMismatches = useMemo((): SchemaMismatch[] | undefined => {
    if (liveResult?.kind !== 'success' || !liveResult.bodyText) return undefined;
    const declared = responses.find((r) => r.status === String(liveResult.status));
    if (!declared?.schema) return undefined;
    try {
      return validateAgainstSchema(declared.schema, JSON.parse(liveResult.bodyText));
    } catch {
      return undefined;
    }
  }, [liveResult, responses]);

  if (status === LIVE_TAB && liveResult) {
    const liveCode =
      liveResult.kind === 'success'
        ? liveResult.bodyText
          ? formatResponseBody(liveResult.bodyText)
          : `// ${liveResult.status} ${liveResult.statusText} — No Content`
        : `// ${liveResult.message}`;
    const liveStatusLabel = liveResult.kind === 'success' ? String(liveResult.status) : 'Error';
    const liveStatusClass =
      liveResult.kind === 'success' ? statusClasses(String(liveResult.status)) : 'bg-destructive/15 text-destructive';

    const token =
      liveResult.kind === 'success' && liveResult.bodyText ? findLikelyToken(liveResult.bodyText) : undefined;
    const tokenSchemeName = token ? findBearerSchemeName(securitySchemes) : undefined;

    return (
      <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-warm">
        <div className="flex items-center gap-1 border-b border-border bg-surface-sunken px-2 py-1.5">
          <span className="px-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Response
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStatus(LIVE_TAB)}
              className={cn('rounded-md px-2 py-1 font-mono text-[11px] transition-colors', liveStatusClass)}
            >
              Live · {liveStatusLabel}
            </button>
            {responses.map((r) => (
              <button
                key={r.status}
                type="button"
                onClick={() => setStatus(r.status)}
                className="rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted"
              >
                {r.status}
              </button>
            ))}
          </div>
        </div>
        <div key="live" className="animate-fade-in-up">
          <div className="flex items-center justify-between px-4 pt-2">
            {liveResult.kind === 'success' && (
              <p className="text-[11px] text-muted-foreground">{liveResult.durationMs.toFixed(0)}ms</p>
            )}
            <div className="flex items-center gap-2">
              {schemaMismatches && <SchemaMatchBadge mismatches={schemaMismatches} />}
              {token && tokenSchemeName && <UseTokenButton schemeName={tokenSchemeName} token={token} />}
            </div>
          </div>
          <CodeBlock code={liveCode} language="json" variant="inline" showCopy className="rounded-none ring-0" />
        </div>
      </div>
    );
  }

  const active = responses.find((r) => r.status === status) ?? responses[0];

  if (!active) {
    return (
      <div className="flex h-40 min-w-0 items-center justify-center rounded-2xl border border-border bg-surface shadow-warm">
        <p className="text-sm text-muted-foreground">No responses declared.</p>
      </div>
    );
  }

  const example = buildSchemaExample(active.schema);
  const code = example ? example.json : `// ${active.status} — No Content`;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-warm">
      <div className="flex items-center gap-1 border-b border-border bg-surface-sunken px-2 py-1.5">
        <span className="px-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Response
        </span>
        <div className="ml-auto flex items-center gap-1">
          {liveResult && (
            <button
              type="button"
              onClick={() => setStatus(LIVE_TAB)}
              className="rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted"
            >
              Live
            </button>
          )}
          {responses.map((r) => (
            <button
              key={r.status}
              type="button"
              onClick={() => setStatus(r.status)}
              className={cn(
                'rounded-md px-2 py-1 font-mono text-[11px] transition-colors',
                r.status === active.status ? statusClasses(r.status) : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {r.status}
            </button>
          ))}
        </div>
      </div>
      <div key={active.status} className="animate-fade-in-up">
        <CodeBlock code={code} language="json" variant="inline" showCopy className="rounded-none ring-0" />
      </div>
    </div>
  );
}
