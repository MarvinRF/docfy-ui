import { useParams } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getConfiguredGuides } from '../lib/guides';
import { CodeBlock } from './CodeBlock';

/**
 * No `@tailwindcss/typography` plugin in this project — element styles are hand-mapped here
 * instead, matching the design tokens (`text-foreground`, `border-border`, ...) every other
 * component in this app already uses, rather than pulling in a whole prose stylesheet for the
 * one page type that needs it.
 */
const markdownComponents: Components = {
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
    const match = /language-(\w+)/.exec(className ?? '');
    if (!match) {
      return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">{children}</code>;
    }
    return (
      <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} variant="inline" className="mb-4" />
    );
  },
};

/** Resolves the route's `:slug` against the guides `DocfyUiModule.setup({ guides })` injected. */
export function GuidePage() {
  const { slug } = useParams();
  const guide = getConfiguredGuides().find((g) => g.slug === slug);

  if (!guide) {
    return <p className="text-foreground">Guide not found.</p>;
  }

  return (
    <article className="animate-fade-in-up mx-auto max-w-3xl px-5 py-10 lg:px-10 xl:py-14">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {guide.content}
      </ReactMarkdown>
    </article>
  );
}
