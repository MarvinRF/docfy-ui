import { useState } from 'react';
import type { SchemaTreeNode } from '../document-model/schema-tree';
import { cn } from '../lib/utils';

export interface SchemaTreeProps {
  nodes: SchemaTreeNode[];
}

const TYPE_CLASSES: Record<string, string> = {
  string: 'text-success',
  number: 'text-info',
  integer: 'text-info',
  boolean: 'text-warning',
  object: 'text-primary',
  array: 'text-primary',
};

function TreeNode({ node, depth }: { node: SchemaTreeNode; depth: number }) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  // Top level (depth 0) expanded by default; deeper nesting starts collapsed.
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded py-1 text-foreground transition-colors duration-100 hover:bg-muted/50"
        style={{ paddingLeft: depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={`Toggle ${node.name}`}
            className={cn('w-4 shrink-0 text-xs text-muted-foreground transition-transform duration-150', expanded ? 'rotate-0' : '-rotate-90')}
          >
            ▾
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="font-mono text-sm font-semibold">{node.name}</span>
        <span
          className={cn(
            'rounded-md bg-surface-sunken px-1.5 py-0.5 font-mono text-[10.5px]',
            TYPE_CLASSES[node.type] ?? 'text-muted-foreground',
          )}
        >
          {node.type}
        </span>
        {node.circular && (
          <span className="text-xs italic text-muted-foreground" title="Recursive reference — already shown above">
            ↩ circular
          </span>
        )}
        {node.required && (
          <span className="rounded px-1 text-[10px] font-medium text-primary-foreground bg-primary">required</span>
        )}
        {node.nullable && <span className="text-xs text-muted-foreground">nullable</span>}
      </div>

      {hasChildren && expanded && (
        <ul className="animate-collapse-in ml-2 border-l border-border">
          {node.children!.map((child) => (
            <TreeNode key={child.name} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Navigable, expandable/collapsible tree view of a JSON Schema's shape. */
export function SchemaTree({ nodes }: SchemaTreeProps) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">No schema available.</p>;
  }

  return (
    <ul aria-label="Schema">
      {nodes.map((node) => (
        <TreeNode key={node.name} node={node} depth={0} />
      ))}
    </ul>
  );
}
