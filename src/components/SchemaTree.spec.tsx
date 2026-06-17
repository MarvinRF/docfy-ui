// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaTree } from './SchemaTree';
import { schemaToTreeNodes } from '../document-model/schema-tree';

describe('<SchemaTree />', () => {
  it('shows a fallback message when there are no nodes', () => {
    render(<SchemaTree nodes={[]} />);
    expect(screen.getByText(/no schema available/i)).toBeInTheDocument();
  });

  it('renders top-level nodes expanded by default', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { data: { type: 'object', properties: { message: { type: 'string' } } } },
    });
    render(<SchemaTree nodes={nodes} />);

    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('message')).toBeInTheDocument();
  });

  it('collapses a nested node by default, expandable on click', async () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: { nested: { type: 'object', properties: { deep: { type: 'string' } } } },
        },
      },
    });
    const user = userEvent.setup();
    render(<SchemaTree nodes={nodes} />);

    expect(screen.getByText('nested')).toBeInTheDocument();
    expect(screen.queryByText('deep')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /toggle nested/i }));
    expect(screen.getByText('deep')).toBeInTheDocument();
  });

  it('shows the required and nullable badges when applicable', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { id: { type: 'string', nullable: true } },
      required: ['id'],
    });
    render(<SchemaTree nodes={nodes} />);

    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.getByText('nullable')).toBeInTheDocument();
  });

  it('renders array nodes with the [] suffix', () => {
    const nodes = schemaToTreeNodes({
      type: 'object',
      properties: { customers: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } } },
    });
    render(<SchemaTree nodes={nodes} />);
    expect(screen.getByText('customers[]')).toBeInTheDocument();
  });
});
