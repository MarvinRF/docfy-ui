import type { ParameterInfo } from '../document-model/types';
import { cn } from '../lib/utils';

export interface ParameterRowProps {
  parameter: ParameterInfo;
}

/** Each parameter rendered as an independent block: name, type, required, description, example. */
export function ParameterRow({ parameter }: ParameterRowProps) {
  const type = typeof parameter.schema?.type === 'string' ? (parameter.schema!.type as string) : 'unknown';
  const example = parameter.schema?.example;

  return (
    <div className="px-4 py-3 transition-colors duration-100 hover:bg-muted/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[13px] font-semibold text-foreground">{parameter.name}</span>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] text-secondary-foreground">
          {type}
        </span>
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 font-mono text-[10.5px] ring-1 ring-inset',
            parameter.required
              ? 'bg-primary/12 text-primary ring-primary/25'
              : 'bg-muted text-muted-foreground ring-border',
          )}
        >
          {parameter.required ? 'required' : 'optional'}
        </span>
      </div>
      {parameter.description && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{parameter.description}</p>
      )}
      {example !== undefined && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">Example: {JSON.stringify(example)}</p>
      )}
    </div>
  );
}
