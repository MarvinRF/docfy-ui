// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OperationHeader } from './OperationHeader';
import type { Endpoint } from '../document-model/types';

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/users',
    operationId: undefined,
    summary: undefined,
    description: undefined,
    tags: [],
    parameters: [],
    requestBody: undefined,
    responses: [],
    ...overrides,
  };
}

describe('<OperationHeader />', () => {
  it('prefers summary as the title', () => {
    render(<OperationHeader endpoint={makeEndpoint({ summary: 'List all users', operationId: 'findAll' })} />);
    expect(screen.getByRole('heading', { name: 'List all users' })).toBeInTheDocument();
  });

  it('falls back to operationId when summary is missing', () => {
    render(<OperationHeader endpoint={makeEndpoint({ operationId: 'findAllUsers' })} />);
    expect(screen.getByRole('heading', { name: 'findAllUsers' })).toBeInTheDocument();
  });

  it('falls back to path when neither summary nor operationId exist', () => {
    render(<OperationHeader endpoint={makeEndpoint({ path: '/users' })} />);
    expect(screen.getByRole('heading', { name: '/users' })).toBeInTheDocument();
  });

  it('renders the description when present', () => {
    render(<OperationHeader endpoint={makeEndpoint({ description: 'Returns a paginated list.' })} />);
    expect(screen.getByText('Returns a paginated list.')).toBeInTheDocument();
  });
});
