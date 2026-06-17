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
      className="min-w-0 overflow-hidden rounded-lg border shadow-sm"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-elevated)",
      }}
    >
      <div
        className="flex items-center gap-2 border-b p-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <MethodBadge method={endpoint.method} />
        <span
          className="truncate font-mono text-sm"
          style={{ color: "var(--color-text)" }}
        >
          {endpoint.path}
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Snippet language"
        className="flex flex-wrap gap-1 border-b p-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        {SNIPPET_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lang === l.id}
            onClick={() => setLang(l.id)}
            className="rounded px-2 py-1 text-xs transition-colors duration-150"
            style={{
              backgroundColor:
                lang === l.id ? "var(--color-accent)" : "transparent",
              color: lang === l.id ? "#FFFFFF" : "var(--color-text)",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <pre
        key={lang}
        className={`themed-scroll animate-fade-in ${SNIPPET_HEIGHT} overflow-auto p-3 text-xs`}
        style={{ color: "var(--color-text)" }}
      >
        <code>{snippet}</code>
      </pre>

      <div
        className="flex items-center justify-between gap-2 border-t p-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <CopyButton text={snippet} label="Copy snippet" />
        <button
          type="button"
          disabled
          title="Coming soon — real request execution is not part of this MVP"
          className="cursor-not-allowed rounded px-3 py-1.5 text-sm font-medium opacity-50"
          style={{ backgroundColor: "var(--color-accent)", color: "#FFFFFF" }}
        >
          Test Request
        </button>
      </div>
    </div>
  );
}
