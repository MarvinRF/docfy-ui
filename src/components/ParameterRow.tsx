import type { ParameterInfo } from '../document-model/types';

export interface ParameterRowProps {
  parameter: ParameterInfo;
}

/** Each parameter rendered as an independent block: name, type, required, description, example. */
export function ParameterRow({ parameter }: ParameterRowProps) {
  const type = typeof parameter.schema?.type === 'string' ? (parameter.schema!.type as string) : 'unknown';
  const example = parameter.schema?.example;

  return (
    <div className="px-3 py-2.5 transition-colors duration-100" style={{ backgroundColor: 'transparent' }}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>{parameter.name}</span>
        <span
          className="rounded-md px-1.5 py-0.5 font-mono text-[10.5px]"
          style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-muted-foreground)' }}
        >
          {type}
        </span>
        {parameter.required && (
          <span
            className="rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            required
          </span>
        )}
      </div>
      {parameter.description && (
        <p className="mt-0.5 text-sm opacity-80" style={{ color: 'var(--color-text)' }}>{parameter.description}</p>
      )}
      {example !== undefined && (
        <p className="mt-0.5 font-mono text-xs opacity-60" style={{ color: 'var(--color-text)' }}>
          Example: {JSON.stringify(example)}
        </p>
      )}
    </div>
  );
}
