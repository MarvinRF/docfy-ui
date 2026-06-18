import type { Endpoint } from "../document-model/types";
import { capDepth } from "../document-model/cap-depth";
import { operationToAiText } from "../transformers/copy-for-ai";
import { OperationHeader } from "./OperationHeader";
import { ParametersSection } from "./ParametersSection";
import { RequestBodySection } from "./RequestBodySection";
import { ResponsesSection } from "./ResponsesSection";
import { RequestPanel } from "./RequestPanel";
import { ResponseViewer } from "./ResponseViewer";
import { CopyButton } from "./CopyButton";

export interface EndpointDetailProps {
  endpoint: Endpoint;
  baseUrl: string;
}

/**
 * Mirrors the reference design's endpoint layout (`routes/index.tsx`):
 * doc body + a sticky playground panel (request + response) from `xl`
 * up. Below `xl` the playground panel doesn't disappear — it collapses
 * under the doc body in its own width-capped block with a "Code
 * examples" heading, same as the reference.
 */
export function EndpointDetail({ endpoint, baseUrl }: EndpointDetailProps) {
  const openApiJson = JSON.stringify(capDepth(endpoint), null, 2);
  const aiText = operationToAiText(endpoint);

  return (
    <>
      <article className="animate-fade-in-up mx-auto flex max-w-[1400px] gap-10 px-5 py-10 lg:px-10 xl:py-14">
        {/* min-w-0: without it, a long unbroken string (e.g. a curl snippet
            with a long URL) forces its track to its content's intrinsic
            width instead of shrinking to the viewport, pushing the whole
            page into horizontal scroll on small screens. */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <CopyButton text={openApiJson} label="Copy OpenAPI" />
            <CopyButton text={aiText} label="Copy as a Prompt" />
          </div>

          <OperationHeader endpoint={endpoint} />

          <div className="mt-8">
            <ParametersSection parameters={endpoint.parameters} />
          </div>

          <RequestBodySection requestBody={endpoint.requestBody} />

          <ResponsesSection responses={endpoint.responses} />
        </div>

        <aside className="hidden w-[500px] shrink-0 xl:block">
          <div className="sticky top-8 flex flex-col gap-4">
            <RequestPanel endpoint={endpoint} baseUrl={baseUrl} />
            <ResponseViewer responses={endpoint.responses} />
          </div>
        </aside>
      </article>

      {/* On narrow screens, show the playground panel below the content for endpoints. */}
      <div className="mx-auto max-w-240 px-5 pb-16 xl:hidden">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Code examples
        </h3>
        <div className="flex flex-col gap-4">
          <RequestPanel endpoint={endpoint} baseUrl={baseUrl} />
          <ResponseViewer responses={endpoint.responses} />
        </div>
      </div>
    </>
  );
}
