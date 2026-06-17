// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import type { Endpoint, TagGroup } from '../document-model/types';

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/users',
    operationId: 'findAllUsers',
    summary: undefined,
    description: undefined,
    tags: ['users'],
    parameters: [],
    requestBody: undefined,
    responses: [],
    ...overrides,
  };
}

function renderSidebar(tagGroups: TagGroup[]) {
  return render(
    <MemoryRouter>
      <Sidebar tagGroups={tagGroups} />
    </MemoryRouter>,
  );
}

describe('<Sidebar />', () => {
  it('renders tag groups in the order provided', () => {
    const groups: TagGroup[] = [
      { name: 'beta', description: undefined, endpoints: [makeEndpoint()] },
      { name: 'alpha', description: undefined, endpoints: [makeEndpoint({ operationId: 'op2' })] },
    ];
    renderSidebar(groups);

    const headings = screen.getAllByRole('button').map((b) => b.textContent);
    expect(headings[0]).toContain('beta');
    expect(headings[1]).toContain('alpha');
  });

  it('renders the method badge and path for each endpoint', () => {
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint({ method: 'POST', path: '/users' })] }]);
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/users')).toBeInTheDocument();
  });

  it('collapses and expands a tag section on click', async () => {
    const user = userEvent.setup();
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint()] }]);

    expect(screen.getByText('/users')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /users/i }));
    expect(screen.queryByText('/users')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /users/i }));
    expect(screen.getByText('/users')).toBeInTheDocument();
  });

  it('links to /:tag/:operationId for each endpoint', () => {
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] }]);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/users/findAllUsers');
  });

  it('keeps each tag group scoped to its own endpoints', () => {
    const groups: TagGroup[] = [
      { name: 'users', description: undefined, endpoints: [makeEndpoint({ path: '/users' })] },
      { name: 'orders', description: undefined, endpoints: [makeEndpoint({ path: '/orders', operationId: 'op2' })] },
    ];
    renderSidebar(groups);

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('/users')).toBeInTheDocument();
    expect(within(nav).getByText('/orders')).toBeInTheDocument();
  });
});
