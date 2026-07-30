import { Check, Copy, Link2, Sparkles } from 'lucide-react';
import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard';
import { cn } from '../lib/utils';

export interface CopyButtonProps {
  text: string;
  label: string;
}

const LABEL_ICONS: Record<string, typeof Copy> = {
  'Copy as a Prompt': Sparkles,
  'Copy MCP Reference': Link2,
};

/** Generic copy button — label swaps to "Copied!" for ~1.5s after a successful copy. */
export function CopyButton({ text, label }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  const Icon = copied ? Check : (LABEL_ICONS[label] ?? Copy);

  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium shadow-warm-sm transition-all duration-150 hover:shadow-warm active:scale-95',
        copied
          ? 'border-transparent bg-primary text-primary-foreground hover:opacity-90'
          : 'border-border bg-surface-elevated text-foreground hover:bg-muted',
      )}
    >
      <Icon size={13} />
      {copied ? 'Copied!' : label}
    </button>
  );
}
