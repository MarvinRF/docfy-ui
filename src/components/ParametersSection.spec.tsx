// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParametersSection } from './ParametersSection';
import type { ParameterInfo } from '../document-model/types';

function makeParam(overrides: Partial<ParameterInfo> = {}): ParameterInfo {
  return { name: 'id', in: 'query', required: false, schema: { type: 'string' }, description: undefined, ...overrides };
}

describe('<ParametersSection />', () => {
  it('renders nothing when there are no parameters', () => {
    const { container } = render(<ParametersSection parameters={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('groups parameters under Path/Query/Headers section labels', () => {
    render(
      <ParametersSection
        parameters={[
          makeParam({ name: 'id', in: 'path', required: true }),
          makeParam({ name: 'search', in: 'query' }),
          makeParam({ name: 'x-api-key', in: 'header' }),
        ]}
      />,
    );

    expect(screen.getByText('Path Parameters')).toBeInTheDocument();
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    expect(screen.getByText('Headers')).toBeInTheDocument();
  });

  it('renders sections in Path -> Query -> Header order regardless of input order', () => {
    render(
      <ParametersSection
        parameters={[makeParam({ name: 'h', in: 'header' }), makeParam({ name: 'p', in: 'path' })]}
      />,
    );
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Path Parameters', 'Headers']);
  });

  it('does not render a cookie parameters section', () => {
    render(<ParametersSection parameters={[makeParam({ name: 'session', in: 'cookie' as 'query' })]} />);
    expect(screen.queryByText(/cookie/i)).not.toBeInTheDocument();
  });

  it('renders the parameter name, type, required flag, and description', () => {
    render(<ParametersSection parameters={[makeParam({ name: 'id', required: true, description: 'Item id' })]} />);
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.getByText('Item id')).toBeInTheDocument();
  });
});
