import type { RequestBodyInfo } from '../document-model/types';
import { buildSchemaExample, withUnionNotes } from '../document-model/example';
import { CodeBlock } from './CodeBlock';

export interface RequestBodySectionProps {
  requestBody: RequestBodyInfo | undefined;
}

/** Request body schema as a type-token JSON example — mirrors ResponsesSection but for the single declared request body. */
export function RequestBodySection({ requestBody }: RequestBodySectionProps) {
  if (!requestBody) return null;

  const example = buildSchemaExample(requestBody.schema);
  const code = example ? withUnionNotes(example.json, example.unionSizes) : '// No content';

  return (
    <section className="mt-12" data-testid="request-body-section">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Request Body
        {requestBody.required && <span className="ml-2 text-warning">required</span>}
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface shadow-warm-sm">
        <CodeBlock code={code} language="json" variant="inline" showCopy />
      </div>
    </section>
  );
}
