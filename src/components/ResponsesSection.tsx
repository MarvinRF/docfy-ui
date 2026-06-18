import type { ResponseInfo } from '../document-model/types';
import { ResponseCard } from './ResponseCard';

export interface ResponsesSectionProps {
  responses: ResponseInfo[];
}

/** All declared responses, in spec declaration order — mirrors the reference's Responses section in `EndpointPage`. */
export function ResponsesSection({ responses }: ResponsesSectionProps) {
  if (responses.length === 0) return null;

  return (
    <section className="mt-12" data-testid="responses-section">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Responses</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {responses.map((response, idx) => (
          <li key={response.status} style={{ animationDelay: `${idx * 40}ms` }} className="animate-fade-in-up">
            <ResponseCard response={response} defaultOpen={idx === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}
