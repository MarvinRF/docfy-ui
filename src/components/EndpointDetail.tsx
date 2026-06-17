import type { Endpoint } from "../document-model/types";
import { capDepth } from "../document-model/cap-depth";
import { pickPrimarySuccessResponse } from "../document-model/example";
import { operationToAiText } from "../transformers/copy-for-ai";
import { OperationHeader } from "./OperationHeader";
import { ParametersSection } from "./ParametersSection";
import { ResponsesSection } from "./ResponsesSection";
import { RequestPanel } from "./RequestPanel";
import { ResponseViewer } from "./ResponseViewer";
import { CopyButton } from "./CopyButton";

export interface EndpointDetailProps {
  endpoint: Endpoint;
  baseUrl: string;
}

/**
 * Scalar-inspired two-column endpoint view: left column is documentation
 * (header, parameters, responses with a navigable schema tree), right
 * column is a playground-style panel (code snippets + a disabled "Test
 * Request" button — real execution is out of scope for this MVP, see the
 * implementation plan).
 */
export function EndpointDetail({ endpoint, baseUrl }: EndpointDetailProps) {
  const openApiJson = JSON.stringify(capDepth(endpoint), null, 2);
  const aiText = operationToAiText(endpoint);
  const primarySuccess = pickPrimarySuccessResponse(endpoint.responses);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      {/* min-w-0 on each grid/flex item: without it, a long unbroken string
          (e.g. a curl snippet with a long URL) forces its track to its
          content's intrinsic width instead of shrinking to the viewport,
          pushing the whole page into horizontal scroll on small screens. */}
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap gap-2">
          <CopyButton text={openApiJson} label="Copy OpenAPI" />
          <CopyButton text={aiText} label="Copy for AI" />
        </div>

        <OperationHeader endpoint={endpoint} />

        <div className="mt-4">
          <ParametersSection parameters={endpoint.parameters} />
        </div>

        <div className="mt-4">
          <ResponsesSection responses={endpoint.responses} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <RequestPanel endpoint={endpoint} baseUrl={baseUrl} />
        <ResponseViewer response={primarySuccess} />
      </div>
    </div>
  );
}
