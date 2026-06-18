import { cn } from '../lib/utils';

const METHOD_CLASSES: Record<string, string> = {
  GET: 'text-method-get bg-method-get/10 ring-method-get/25',
  POST: 'text-method-post bg-method-post/12 ring-method-post/30',
  PUT: 'text-method-put bg-method-put/12 ring-method-put/30',
  PATCH: 'text-method-put bg-method-put/12 ring-method-put/30',
  DELETE: 'text-method-delete bg-method-delete/15 ring-method-delete/30',
};

const DEFAULT_CLASSES = 'text-muted-foreground bg-muted ring-border';

export interface MethodBadgeProps {
  method: string;
  className?: string;
}

/** Color-coded HTTP method badge — GET green, POST clay, PUT/PATCH amber, DELETE red. */
export function MethodBadge({ method, className }: MethodBadgeProps) {
  const upper = method.toUpperCase();

  return (
    <span
      data-method={upper}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wide ring-1 ring-inset',
        METHOD_CLASSES[upper] ?? DEFAULT_CLASSES,
        className,
      )}
    >
      {upper}
    </span>
  );
}
