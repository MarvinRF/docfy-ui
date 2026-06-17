import { useCallback, useRef, useState } from 'react';

function fallbackCopy(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Copies text to the clipboard, using the async Clipboard API when
 * available and falling back to a hidden textarea + execCommand('copy')
 * for non-secure contexts (e.g. plain HTTP). `copied` flips to true for
 * `resetMs` after a successful copy — drive a "Copied!" label off it.
 */
export function useCopyToClipboard(resetMs = 1500): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const markCopied = useCallback(() => {
    setCopied(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), resetMs);
  }, [resetMs]);

  const copy = useCallback((text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(markCopied).catch(() => {
        fallbackCopy(text);
        markCopied();
      });
    } else {
      fallbackCopy(text);
      markCopied();
    }
  }, [markCopied]);

  return { copied, copy };
}
