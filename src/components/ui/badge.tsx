import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-accent)]/12 text-[var(--color-accent)] ring-[var(--color-accent)]/30',
        muted:
          'bg-[var(--color-bg-elevated)] text-[var(--color-muted-foreground)] ring-[var(--color-border)]',
        success: 'bg-[var(--color-success)]/12 text-[var(--color-success)] ring-[var(--color-success)]/30',
        warning: 'bg-[var(--color-warning)]/12 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
        destructive:
          'bg-[var(--color-destructive)]/12 text-[var(--color-destructive)] ring-[var(--color-destructive)]/30',
        info: 'bg-[var(--color-info)]/12 text-[var(--color-info)] ring-[var(--color-info)]/30',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
