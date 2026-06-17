import { useState } from 'react';
import type { SchemaTreeNode } from '../document-model/schema-tree';

export interface SchemaTreeProps {
  nodes: SchemaTreeNode[];
}

const TYPE_COLOR: Record<string, string> = {
  string: 'text-green-400',
  number: 'text-blue-400',
  integer: 'text-blue-400',
  boolean: 'text-yellow-400',
  object: 'text-purple-400',
  array: 'text-purple-400',
};

function TreeNode({ node, depth }: { node: SchemaTreeNode; depth: number }) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  // Top level (depth 0) expanded by default; deeper nesting starts collapsed.
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <li>
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: depth * 16, color: 'var(--color-text)' }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={`Toggle ${node.name}`}
            className="w-4 shrink-0 text-xs opacity-70"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="font-mono text-sm">{node.name}</span>
        <span className={`text-xs ${TYPE_COLOR[node.type] ?? 'text-gray-400'}`}>{node.type}</span>
        {node.required && <span className="text-xs opacity-60">required</span>}
        {node.nullable && <span className="text-xs opacity-60">nullable</span>}
      </div>

      {hasChildren && expanded && (
        <ul>
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
    return <p className="text-sm opacity-60" style={{ color: 'var(--color-text)' }}>No schema available.</p>;
  }

  return (
    <ul aria-label="Schema">
      {nodes.map((node) => (
        <TreeNode key={node.name} node={node} depth={0} />
      ))}
    </ul>
  );
}
