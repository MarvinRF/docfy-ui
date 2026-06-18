import { useState } from "react";
import type { Endpoint } from "../document-model/types";
import {
  buildCodeSnippet,
  SNIPPET_LANGUAGES,
  type SnippetLang,
} from "../transformers/code-snippets";
import { MethodBadge } from "./MethodBadge";
import { CopyButton } from "./CopyButton";

export interface RequestPanelProps {
  endpoint: Endpoint;
  baseUrl: string;
}

/** Fixed snippet height — long bodies scroll instead of pushing the layout around. */
const SNIPPET_HEIGHT = "h-30";

/**
 * Request header + language-switchable code snippet + a disabled "Test
 * Request" button. Real request execution is explicitly out of scope for
 * this MVP — see the implementation plan.
 */
export function RequestPanel({ endpoint, baseUrl }: RequestPanelProps) {
  const [lang, setLang] = useState<SnippetLang>(SNIPPET_LANGUAGES[0].id);
  const snippet = buildCodeSnippet(endpoint, baseUrl, lang);

  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl shadow-(--shadow-warm-lg) ring-1 ring-black/30"
      style={{ backgroundColor: "var(--color-terminal-bg)" }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ff5f57", opacity: 0.8 }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#febc2e", opacity: 0.8 }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#28c840", opacity: 0.8 }} />
        </div>
        <MethodBadge method={endpoint.method} />
        <span
          className="truncate font-mono text-sm"
          style={{ color: "var(--color-terminal-fg)" }}
        >
          {endpoint.path}
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Snippet language"
        className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-1.5"
      >
        {SNIPPET_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lang === l.id}
            onClick={() => setLang(l.id)}
            className="rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-150"
            style={{
              backgroundColor: lang === l.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: "var(--color-terminal-fg)",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <pre
        key={lang}
        className={`themed-scroll animate-fade-in ${SNIPPET_HEIGHT} overflow-auto p-3 font-mono text-[12.5px] leading-relaxed`}
        style={{ color: "var(--color-terminal-fg)" }}
      >
        <code>{snippet}</code>
      </pre>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 p-3">
        <CopyButton text={snippet} label="Copy snippet" />
        <button
          type="button"
          disabled
          title="Coming soon — real request execution is not part of this MVP"
          className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm font-medium opacity-50"
          style={{ backgroundColor: "var(--color-accent)", color: "#FFFFFF" }}
        >
          Test Request
        </button>
      </div>
    </div>
  );
}
