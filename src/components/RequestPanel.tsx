import { useState } from 'react';
import type { Endpoint } from '../document-model/types';
import {
  buildCodeSnippet,
  SNIPPET_LANGUAGES,
  type SnippetLang,
} from '../transformers/code-snippets';
import { MethodBadge } from './MethodBadge';
import { CodeBlock } from './CodeBlock';
import { CopyButton } from './CopyButton';
import { cn } from '../lib/utils';

export interface RequestPanelProps {
  endpoint: Endpoint;
  baseUrl: string;
}

/**
 * Request header + language-switchable code snippet + a disabled "Test
 * Request" button. Real request execution is explicitly out of scope for
 * this MVP — see the implementation plan.
 */
export function RequestPanel({ endpoint, baseUrl }: RequestPanelProps) {
  const [lang, setLang] = useState<SnippetLang>(SNIPPET_LANGUAGES[0].id);
  const snippet = buildCodeSnippet(endpoint, baseUrl, lang);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-terminal-bg shadow-warm-lg ring-1 ring-black/30">
      <div data-testid="request-panel-header" className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <MethodBadge method={endpoint.method} />
        <span className="truncate font-mono text-sm text-terminal-fg">{endpoint.path}</span>
      </div>

      <div role="tablist" aria-label="Snippet language" className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-1.5">
        {SNIPPET_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lang === l.id}
            onClick={() => setLang(l.id)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11.5px] font-medium text-terminal-fg transition-colors duration-150',
              lang === l.id ? 'bg-white/10' : 'text-terminal-fg/55 hover:bg-white/5 hover:text-terminal-fg',
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div key={lang} className="animate-fade-in">
        <CodeBlock code={snippet} language={lang} variant="terminal" showCopy={false} className="rounded-none ring-0" />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 p-3">
        <CopyButton text={snippet} label="Copy snippet" />
        <button
          type="button"
          disabled
          title="Coming soon — real request execution is not part of this MVP"
          className="cursor-not-allowed rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground opacity-50 shadow-glow"
        >
          Test Request
        </button>
      </div>
    </div>
  );
}
