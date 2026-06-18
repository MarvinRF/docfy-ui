const METHOD_VAR: Record<string, string> = {
  GET: '--color-method-get',
  POST: '--color-method-post',
  PUT: '--color-method-put',
  PATCH: '--color-method-patch',
  DELETE: '--color-method-delete',
};

const DEFAULT_VAR = '--color-muted-foreground';

export interface MethodBadgeProps {
  method: string;
}

/** Color-coded HTTP method badge — GET blue, POST green, PUT/PATCH yellow, DELETE red (Swagger UI/Scalar convention). */
export function MethodBadge({ method }: MethodBadgeProps) {
  const upper = method.toUpperCase();
  const colorVar = METHOD_VAR[upper] ?? DEFAULT_VAR;

  return (
    <span
      data-method={upper}
      className="inline-flex w-16 shrink-0 justify-center rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ring-1 ring-inset"
      style={{
        color: `var(${colorVar})`,
        backgroundColor: `color-mix(in srgb, var(${colorVar}) 12%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${colorVar}) 30%, transparent)`,
      }}
    >
      {upper}
    </span>
  );
}
