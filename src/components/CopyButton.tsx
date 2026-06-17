import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard';

export interface CopyButtonProps {
  text: string;
  label: string;
}

/** Generic copy button — label swaps to "Copied!" for ~1.5s after a successful copy. */
export function CopyButton({ text, label }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className="rounded px-3 py-1.5 text-sm font-medium shadow-sm transition-all duration-150 hover:opacity-90 hover:shadow-md active:scale-95"
      style={{
        backgroundColor: copied ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
        color: copied ? '#FFFFFF' : 'var(--color-text)',
        border: copied ? 'none' : '1px solid var(--color-border)',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
