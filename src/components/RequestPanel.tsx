import { useState } from 'react';
import type { Endpoint, SecuritySchemeInfo } from '../document-model/types';
import {
  buildCodeSnippet,
  SNIPPET_LANGUAGES,
  type SnippetLang,
} from '../transformers/code-snippets';
import { MethodBadge } from './MethodBadge';
import { CodeBlock } from './CodeBlock';
import { CopyButton } from './CopyButton';
import { TryItForm } from './TryItForm';
import { cn } from '../lib/utils';

export interface RequestPanelProps {
  endpoint: Endpoint;
  baseUrl: string;
  securitySchemes?: Record<string, SecuritySchemeInfo>;
  servers?: string[];
}

type PanelMode = 'code' | 'try-it';

/** Request header + a Code/Try it out mode switch: a language-switchable code
 * snippet, or an editable form that executes a real request. */
export function RequestPanel({ endpoint, baseUrl, securitySchemes = {}, servers = [] }: RequestPanelProps) {
  const [mode, setMode] = useState<PanelMode>('code');
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

      <div role="tablist" aria-label="Panel mode" className="flex gap-1 border-b border-white/10 px-2 py-1.5">
        {(['code', 'try-it'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11.5px] font-medium text-terminal-fg transition-colors duration-150',
              mode === m ? 'bg-white/10' : 'text-terminal-fg/55 hover:bg-white/5 hover:text-terminal-fg',
            )}
          >
            {m === 'code' ? 'Code' : 'Try it out'}
          </button>
        ))}
      </div>

      {mode === 'code' ? (
        <>
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
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <TryItForm endpoint={endpoint} baseUrl={baseUrl} securitySchemes={securitySchemes} servers={servers} />
        </div>
      )}
    </div>
  );
}
