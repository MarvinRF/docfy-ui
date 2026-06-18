import type { ResponseInfo } from '../document-model/types';
import { ResponseCard } from './ResponseCard';

export interface ResponsesSectionProps {
  responses: ResponseInfo[];
}

/** All declared responses, in spec declaration order. */
export function ResponsesSection({ responses }: ResponsesSectionProps) {
  if (responses.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] opacity-70" style={{ color: 'var(--color-text)' }}>
        Responses
      </h3>
      {responses.map((response) => (
        <ResponseCard key={response.status} response={response} />
      ))}
    </div>
  );
}
