import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export interface CommandDialogProps extends DialogPrimitive.DialogProps {
  children: React.ReactNode;
}

export function CommandDialog({ children, ...props }: CommandDialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-[100] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border shadow-[var(--shadow-warm-lg)] animate-slide-in"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
          }}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Search endpoints</DialogPrimitive.Title>
          <Command shouldFilter={false}>{children}</Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center gap-2 border-b px-4 py-3"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <Search size={16} style={{ color: 'var(--color-muted-foreground)' }} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-60',
        className,
      )}
      style={{ color: 'var(--color-text)' }}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[50vh] overflow-y-auto themed-scroll p-2', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm opacity-60"
    style={{ color: 'var(--color-text)' }}
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn('[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:opacity-60', className)}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-[var(--color-accent)]/12',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';
