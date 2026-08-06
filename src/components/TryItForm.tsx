import type { Endpoint, SecuritySchemeInfo } from '../document-model/types';
import { buildSchemaExample } from '../document-model/example';
import { executeRequest } from '../transformers/execute-request';
import { buildCurlCommand } from '../transformers/build-curl';
import { endpointKeyFor, useTryItRequestState, useTryItStore } from '../state/try-it-store';
import { AuthPanel } from './AuthPanel';
import { CopyButton } from './CopyButton';

export interface TryItFormProps {
  endpoint: Endpoint;
  baseUrl: string;
  securitySchemes: Record<string, SecuritySchemeInfo>;
  /** Absolute server URLs declared in the OpenAPI `servers[]` array — when present, the first one
   * prefills the Base URL field instead of `baseUrl` (which otherwise defaults to the page's own
   * origin, rarely the actual API host). Still freely editable either way. */
  servers?: string[];
}

const GROUP_LABELS: Record<string, string> = { path: 'Path Parameters', query: 'Query Parameters', header: 'Headers' };
const GROUP_ORDER = ['path', 'query', 'header'];

export function TryItForm({ endpoint, baseUrl, securitySchemes, servers = [] }: TryItFormProps) {
  const endpointKey = endpointKeyFor(endpoint);
  const { paramValues, bodyText, baseUrlOverride, loading } = useTryItRequestState(endpointKey);
  const defaultBaseUrl = servers[0] ?? baseUrl;
  const setParamValue = useTryItStore((s) => s.setParamValue);
  const setBodyText = useTryItStore((s) => s.setBodyText);
  const setBaseUrlOverride = useTryItStore((s) => s.setBaseUrlOverride);
  const setLoading = useTryItStore((s) => s.setLoading);
  const setResult = useTryItStore((s) => s.setResult);
  const authValues = useTryItStore((s) => s.authValues);

  const groups = GROUP_ORDER.map((kind) => ({
    kind,
    items: endpoint.parameters.filter((p) => p.in === kind),
  })).filter((g) => g.items.length > 0);

  const bodyExample = endpoint.requestBody ? buildSchemaExample(endpoint.requestBody.schema)?.json : undefined;
  const effectiveBodyText = bodyText ?? bodyExample ?? '';

  // Same inputs `handleSend()` is about to fetch with — this curl is guaranteed to reproduce
  // the actual request, not a generic placeholder example (see the static "Code" tab for that).
  const curlCommand = buildCurlCommand(endpoint, {
    baseUrl: baseUrlOverride ?? defaultBaseUrl,
    paramValues,
    bodyText: effectiveBodyText,
    authValues,
    securitySchemes,
  });

  async function handleSend() {
    setLoading(endpointKey, true);
    setResult(endpointKey, undefined);
    const result = await executeRequest(endpoint, {
      baseUrl: baseUrlOverride ?? defaultBaseUrl,
      paramValues,
      bodyText: effectiveBodyText,
      authValues,
      securitySchemes,
    });
    setResult(endpointKey, result);
    setLoading(endpointKey, false);
  }

  return (
    <div className="flex flex-col gap-3 p-3 text-terminal-fg">
      <label className="flex flex-col gap-1 text-xs text-terminal-fg/80">
        Base URL
        <input
          type="text"
          value={baseUrlOverride ?? defaultBaseUrl}
          onChange={(e) => setBaseUrlOverride(endpointKey, e.target.value)}
          className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-terminal-fg outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </label>

      {groups.map((group) => (
        <div key={group.kind} className="flex flex-col gap-2">
          <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-terminal-fg/55">
            {GROUP_LABELS[group.kind]}
          </h4>
          {group.items.map((param) => (
            <label key={param.name} className="flex flex-col gap-1 text-xs text-terminal-fg/80">
              {param.name}
              {param.required && <span className="text-warning"> *</span>}
              <input
                type="text"
                value={paramValues[param.name] ?? ''}
                onChange={(e) => setParamValue(endpointKey, param.name, e.target.value)}
                className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-terminal-fg outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              />
            </label>
          ))}
        </div>
      ))}

      {endpoint.requestBody && (
        <label className="flex flex-col gap-1 text-xs text-terminal-fg/80">
          Body
          <textarea
            value={effectiveBodyText}
            onChange={(e) => setBodyText(endpointKey, e.target.value)}
            rows={6}
            className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-terminal-fg outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </label>
      )}

      <AuthPanel security={endpoint.security} securitySchemes={securitySchemes} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-glow disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
        <CopyButton text={curlCommand} label="Copy as curl" />
      </div>
    </div>
  );
}
