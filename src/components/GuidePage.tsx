import { useParams } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getConfiguredGuides } from '../lib/guides';
import { findEndpoint } from '../document-model/find-endpoint';
import type { SecuritySchemeInfo, TagGroup } from '../document-model/types';
import { CodeBlock } from './CodeBlock';
import { RequestPanel } from './RequestPanel';

/** Parses a `docfy-try` fence's first line: `METHOD /path`. Returns null when malformed. */
function parseTryBlock(content: string): { method: string; path: string } | null {
  const firstLine = content.trim().split('\n')[0] ?? '';
  const match = /^([A-Za-z]+)\s+(\/\S*)$/.exec(firstLine);
  if (!match) return null;
  return { method: match[1], path: match[2] };
}

interface TryBlockProps {
  content: string;
  tagGroups: TagGroup[];
  baseUrl: string;
  securitySchemes: Record<string, SecuritySchemeInfo>;
  servers: string[];
}

function TryBlock({ content, tagGroups, baseUrl, securitySchemes, servers }: TryBlockProps) {
  const parsed = parseTryBlock(content);
  if (!parsed) {
    return (
      <p className="mb-4 text-sm text-destructive">
        Invalid docfy-try block — expected a single line: <code>METHOD /path</code>.
      </p>
    );
  }

  const endpoint = findEndpoint(tagGroups, parsed.method, parsed.path);
  if (!endpoint) {
    return (
      <p className="mb-4 text-sm text-destructive">
        docfy-try: no endpoint matches{' '}
        <code>
          {parsed.method} {parsed.path}
        </code>{' '}
        in the current spec.
      </p>
    );
  }

  return (
    <div className="mb-4">
      <RequestPanel endpoint={endpoint} baseUrl={baseUrl} securitySchemes={securitySchemes} servers={servers} />
    </div>
  );
}

/**
 * No `@tailwindcss/typography` plugin in this project — element styles are hand-mapped here
 * instead, matching the design tokens (`text-foreground`, `border-border`, ...) every other
 * component in this app already uses, rather than pulling in a whole prose stylesheet for the
 * one page type that needs it.
 */
function buildMarkdownComponents(tryCtx: Omit<TryBlockProps, 'content'>): Components {
  return {
    h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-semibold text-foreground first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-3 mt-8 text-xl font-semibold text-foreground first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold text-foreground">{children}</h3>,
    p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>,
    a: ({ href, children }) => (
      <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80">
        {children}
      </a>
    ),
    ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6 text-foreground/90">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-foreground/90">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-2 border-border pl-4 italic text-muted-foreground">{children}</blockquote>
    ),
    hr: () => <hr className="my-8 border-border" />,
    table: ({ children }) => (
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
    // react-markdown v9+ dropped the `inline` prop — a fenced block carries a `language-xxx`
    // className from remark/rehype; anything else (single backtick) is inline.
    code({ className, children }) {
      const match = /language-([\w-]+)/.exec(className ?? '');
      if (!match) {
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">{children}</code>
        );
      }
      const raw = String(children).replace(/\n$/, '');
      if (match[1] === 'docfy-try') {
        return <TryBlock content={raw} {...tryCtx} />;
      }
      return <CodeBlock code={raw} language={match[1]} variant="inline" className="mb-4" />;
    },
  };
}

export interface GuidePageProps {
  tagGroups?: TagGroup[];
  baseUrl?: string;
  securitySchemes?: Record<string, SecuritySchemeInfo>;
  servers?: string[];
}

/**
 * Resolves the route's `:slug` against the guides `DocfyUiModule.setup({ guides })` injected.
 * `tagGroups`/`baseUrl`/`securitySchemes`/`servers` are only needed to resolve `docfy-try`
 * fences (embedded Try it out) — same props `EndpointRoute` already threads through, so a
 * guide without any `docfy-try` block works fine without them.
 */
export function GuidePage({ tagGroups = [], baseUrl = '', securitySchemes = {}, servers = [] }: GuidePageProps) {
  const { slug } = useParams();
  const guide = getConfiguredGuides().find((g) => g.slug === slug);

  if (!guide) {
    return <p className="text-foreground">Guide not found.</p>;
  }

  const markdownComponents = buildMarkdownComponents({ tagGroups, baseUrl, securitySchemes, servers });

  return (
    <article className="animate-fade-in-up mx-auto max-w-3xl px-5 py-10 lg:px-10 xl:py-14">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {guide.content}
      </ReactMarkdown>
    </article>
  );
}
