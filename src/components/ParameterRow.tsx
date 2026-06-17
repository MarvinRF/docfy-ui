import type { ParameterInfo } from '../document-model/types';

export interface ParameterRowProps {
  parameter: ParameterInfo;
}

/** Each parameter rendered as an independent block: name, type, required, description, example. */
export function ParameterRow({ parameter }: ParameterRowProps) {
  const type = typeof parameter.schema?.type === 'string' ? (parameter.schema!.type as string) : 'unknown';
  const example = parameter.schema?.example;

  return (
    <div className="border-b py-2 last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium" style={{ color: 'var(--color-text)' }}>{parameter.name}</span>
        <span className="text-xs opacity-60" style={{ color: 'var(--color-text)' }}>{type}</span>
        {parameter.required && <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>required</span>}
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
