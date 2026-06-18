import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

/** Tiny manual tokenizer — string / number / keyword / comment / punctuation. */
function tokenize(src: string, lang: string) {
  const out: { t: string; c?: string }[] = [];
  const keywords =
    /\b(const|let|var|function|return|await|async|import|from|export|if|else|for|while|new|class|in|of|true|false|null|None|True|False|def|as|with|except|try|finally|raise|package|func|nil|struct)\b/;
  const re =
    /("(?:\\.|[^"\\])*")|(`(?:\\.|[^`\\])*`)|('(?:\\.|[^'\\])*')|(\/\/[^\n]*|#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([{}[\]();,:.=+\-*/<>?!&|@])/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: src.slice(last, m.index) });
    const [tok, dq, bt, sq, com, num, ident, , punc] = m;
    if (dq || bt || sq) out.push({ t: tok, c: 'text-syn-str' });
    else if (com) out.push({ t: tok, c: 'text-syn-com italic' });
    else if (num) out.push({ t: tok, c: 'text-syn-num' });
    else if (ident && keywords.test(ident)) out.push({ t: tok, c: 'text-syn-kw' });
    else if (ident) out.push({ t: tok, c: lang === 'shell' ? 'text-terminal-fg' : undefined });
    else if (punc) out.push({ t: tok, c: 'text-syn-punc' });
    else out.push({ t: tok });
    last = m.index + tok.length;
  }
  if (last < src.length) out.push({ t: src.slice(last) });
  return out;
}

export interface CodeBlockProps {
  code: string;
  language: string;
  variant?: 'terminal' | 'inline';
  showCopy?: boolean;
  label?: string;
  className?: string;
  showCursor?: boolean;
}

/**
 * Syntax-highlighted code display — `terminal` variant for request/response
 * snippets (macOS traffic-light dots, dark terminal surface), `inline`
 * variant for embedded JSON bodies (sunken surface, matches surrounding
 * content). Highlighting is a small manual tokenizer, not a real grammar —
 * good enough for the request/response/snippet content this app renders.
 */
export function CodeBlock({
  code,
  language,
  variant = 'terminal',
  showCopy = true,
  label,
  className,
  showCursor = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(() => tokenize(code, language), [code, language]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const isTerminal = variant === 'terminal';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl font-mono text-[12.5px] leading-relaxed',
        isTerminal
          ? 'bg-terminal-bg text-terminal-fg ring-1 ring-black/30'
          : 'bg-surface-sunken text-foreground ring-1 ring-border',
        className,
      )}
    >
      {(label || showCopy) && (
        <div
          className={cn(
            'flex items-center justify-between border-b px-3 py-2',
            isTerminal ? 'border-white/10' : 'border-border',
          )}
        >
          <div className="flex items-center gap-2">
            {isTerminal && (
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
                <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
                <span className="size-2.5 rounded-full bg-[#28c840]/80" />
              </div>
            )}
            {label && (
              <span
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wider',
                  isTerminal ? 'text-terminal-fg/60' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            )}
          </div>
          {showCopy && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(code).catch(() => {});
                setCopied(true);
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                isTerminal
                  ? 'text-terminal-fg/70 hover:bg-white/8 hover:text-terminal-fg'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}
      <pre className="themed-scroll overflow-x-auto px-4 py-3.5">
        <code>
          {tokens.map((tk, i) => (
            <span key={i} className={tk.c}>
              {tk.t}
            </span>
          ))}
          {showCursor && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 -translate-y-px animate-blink bg-primary align-middle" />
          )}
        </code>
      </pre>
    </div>
  );
}
