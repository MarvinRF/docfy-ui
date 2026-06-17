// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Shell } from './Shell';
import { useThemeStore } from '../state/theme-store';
import type { Endpoint, TagGroup } from '../document-model/types';

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/users',
    operationId: 'findAllUsers',
    summary: 'List all users',
    description: undefined,
    tags: ['users'],
    parameters: [],
    requestBody: undefined,
    responses: [],
    ...overrides,
  };
}

const TAG_GROUPS: TagGroup[] = [
  { name: 'users', description: undefined, endpoints: [makeEndpoint()] },
  { name: 'orders', description: undefined, endpoints: [makeEndpoint({ path: '/orders', operationId: 'findAllOrders', summary: 'List orders' })] },
];

function renderShell(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Shell tagGroups={TAG_GROUPS} />
    </MemoryRouter>,
  );
}

describe('<Shell />', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'dark' });
  });

  it('shows the empty state at the root route', () => {
    renderShell('/');
    expect(screen.getByText(/select an endpoint/i)).toBeInTheDocument();
  });

  it('renders the endpoint detail when navigating to /:tag/:operationId', () => {
    renderShell('/users/findAllUsers');
    expect(screen.getByRole('heading', { name: 'List all users' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy for AI' })).toBeInTheDocument();
  });

  it('search filters the sidebar to matching endpoints only', async () => {
    const user = userEvent.setup();
    renderShell('/');

    expect(screen.getByText('/users')).toBeInTheDocument();
    expect(screen.getByText('/orders')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'orders');

    expect(screen.queryByText('/users')).not.toBeInTheDocument();
    expect(screen.getByText('/orders')).toBeInTheDocument();
  });

  it('toggles the theme without unmounting the page', async () => {
    const user = userEvent.setup();
    renderShell('/');

    expect(useThemeStore.getState().theme).toBe('dark');
    await user.click(screen.getByRole('button', { name: /light mode/i }));
    expect(useThemeStore.getState().theme).toBe('light');
    expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument();
  });

  it('opens the mobile sidebar drawer via the hamburger button, with a backdrop to close it', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const backdrop = screen.getByTestId('sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    await user.click(backdrop);
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});
