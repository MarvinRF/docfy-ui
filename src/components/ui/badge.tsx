import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: 'bg-primary/12 text-primary ring-primary/30',
        muted: 'bg-surface-elevated text-muted-foreground ring-border',
        success: 'bg-success/12 text-success ring-success/30',
        warning: 'bg-warning/12 text-warning ring-warning/30',
        destructive: 'bg-destructive/12 text-destructive ring-destructive/30',
        info: 'bg-info/12 text-info ring-info/30',
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
