import type { RequestBodyInfo } from '../document-model/types';
import { buildSchemaExample, withUnionNotes } from '../document-model/example';
import { schemaToTreeNodes } from '../document-model/schema-tree';
import type { SchemaAnchor } from '../document-model/schema-anchor';
import { CodeBlock } from './CodeBlock';
import { SchemaTree } from './SchemaTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export interface RequestBodySectionProps {
  requestBody: RequestBodyInfo | undefined;
  /** Deep-link target from the URL hash, if it points into the request body's schema. */
  activeTarget?: SchemaAnchor;
}

const SCOPE = 'request-body';

/** Request body schema as a type-token JSON example, plus a navigable Schema tab — mirrors ResponsesSection but for the single declared request body. */
export function RequestBodySection({ requestBody, activeTarget }: RequestBodySectionProps) {
  if (!requestBody) return null;

  const targetsThis = activeTarget?.scope === SCOPE;
  const example = buildSchemaExample(requestBody.schema);
  const code = example ? withUnionNotes(example.json, example.unionSizes) : '// No content';
  const treeNodes = schemaToTreeNodes(requestBody.schema);

  return (
    <section className="mt-12" data-testid="request-body-section">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Request Body
        {requestBody.required && <span className="ml-2 text-warning">required</span>}
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface shadow-warm-sm">
        <div className="p-4">
          <Tabs defaultValue={targetsThis ? 'schema' : 'example'}>
            <TabsList>
              <TabsTrigger value="example">Example</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>
            <TabsContent value="example">
              <CodeBlock code={code} language="json" variant="inline" showCopy />
            </TabsContent>
            <TabsContent value="schema">
              <SchemaTree nodes={treeNodes} idScope={SCOPE} activePath={targetsThis ? activeTarget.path : undefined} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
