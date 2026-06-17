const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/20 text-blue-400',
  POST: 'bg-green-500/20 text-green-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  PATCH: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

const DEFAULT_COLOR = 'bg-gray-500/20 text-gray-400';

export interface MethodBadgeProps {
  method: string;
}

/** Color-coded HTTP method badge — GET blue, POST green, PUT/PATCH yellow, DELETE red (Swagger UI/Scalar convention). */
export function MethodBadge({ method }: MethodBadgeProps) {
  const upper = method.toUpperCase();
  const colorClass = METHOD_COLORS[upper] ?? DEFAULT_COLOR;

  return (
    <span className={`inline-flex w-16 shrink-0 justify-center rounded px-1.5 py-0.5 text-xs font-bold tracking-wide ${colorClass}`}>
      {upper}
    </span>
  );
}
