import type { ParameterInfo } from "../document-model/types";
import { ParameterRow } from "./ParameterRow";

export interface ParametersSectionProps {
  parameters: ParameterInfo[];
}

const GROUP_LABELS: Record<string, string> = {
  path: "Path Parameters",
  query: "Query Parameters",
  header: "Headers",
};

const GROUP_ORDER = ["path", "query", "header"];

/** Parameters grouped into Path/Query/Header sections — cookie params are out of scope (mirrors Copy for AI). */
export function ParametersSection({ parameters }: ParametersSectionProps) {
  const groups = GROUP_ORDER.map((kind) => ({
    kind,
    items: parameters.filter((p) => p.in === kind),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div>
      {groups.map((group) => (
        <div key={group.kind} className="mb-6">
          <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {GROUP_LABELS[group.kind]}
          </h3>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface-sunken shadow-warm-sm">
            {group.items.map((param) => (
              <ParameterRow key={param.name} parameter={param} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
