import { Check, Copy } from 'lucide-react';
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
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium shadow-(--shadow-warm-sm) transition-all duration-150 hover:opacity-90 hover:shadow-(--shadow-warm) active:scale-95"
      style={{
        backgroundColor: copied ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
        color: copied ? '#FFFFFF' : 'var(--color-text)',
        border: copied ? 'none' : '1px solid var(--color-border)',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}
