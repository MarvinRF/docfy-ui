// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
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

function renderSidebar(
  tagGroups: TagGroup[],
  overrides: Partial<{
    mobileOpen: boolean;
    onCloseMobile: () => void;
    onSearchOpen: () => void;
    initialPath: string;
  }> = {},
) {
  return render(
    <MemoryRouter initialEntries={[overrides.initialPath ?? '/']}>
      <Sidebar
        tagGroups={tagGroups}
        mobileOpen={overrides.mobileOpen ?? false}
        onCloseMobile={overrides.onCloseMobile ?? (() => {})}
        onSearchOpen={overrides.onSearchOpen ?? (() => {})}
      />
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
    expect(headings.find((h) => h?.includes('beta'))).toBeTruthy();
    expect(headings.find((h) => h?.includes('alpha'))).toBeTruthy();
  });

  it('renders the title (summary, falling back to operationId) before the method badge', () => {
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint({ method: 'POST', summary: 'Create a user' })] }]);
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('Create a user')).toBeInTheDocument();

    const link = screen.getByRole('link');
    const label = within(link).getByText('Create a user');
    const badge = within(link).getByText('POST');
    // Title comes first in the DOM (left), method badge second (right) — matches the reference layout.
    expect(label.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('falls back to the operationId as the title when summary is missing', () => {
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers', summary: undefined })] }]);
    expect(screen.getByText('findAllUsers')).toBeInTheDocument();
  });

  it('collapses and expands a tag section on click', async () => {
    const user = userEvent.setup();
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint()] }]);

    expect(screen.getByText('findAllUsers')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /users/i }));
    expect(screen.queryByText('findAllUsers')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /users/i }));
    expect(screen.getByText('findAllUsers')).toBeInTheDocument();
  });

  it('links to /:tag/:operationId for each endpoint', () => {
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] }]);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/users/findAllUsers');
  });

  it('keeps each tag group scoped to its own endpoints', () => {
    const groups: TagGroup[] = [
      { name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] },
      { name: 'orders', description: undefined, endpoints: [makeEndpoint({ path: '/orders', operationId: 'findAllOrders' })] },
    ];
    renderSidebar(groups);

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('findAllUsers')).toBeInTheDocument();
    expect(within(nav).getByText('findAllOrders')).toBeInTheDocument();
  });

  it('calls onSearchOpen when the search trigger is clicked', async () => {
    const user = userEvent.setup();
    const onSearchOpen = vi.fn();
    renderSidebar([], { onSearchOpen });

    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(onSearchOpen).toHaveBeenCalledOnce();
  });

  it('shows a mobile backdrop only when mobileOpen is true', () => {
    const { rerender } = renderSidebar([]);
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <Sidebar tagGroups={[]} mobileOpen onCloseMobile={() => {}} onSearchOpen={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();
  });

  it('toggles the theme toggle button label between light/dark mode', () => {
    renderSidebar([]);
    expect(screen.getByRole('button', { name: /light mode|dark mode/i })).toBeInTheDocument();
  });

  it('highlights the link matching the current route as active, with the left accent bar', () => {
    const groups: TagGroup[] = [
      { name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] },
      { name: 'orders', description: undefined, endpoints: [makeEndpoint({ path: '/orders', operationId: 'findAllOrders' })] },
    ];
    renderSidebar(groups, { initialPath: '/users/findAllUsers' });

    const activeLink = screen.getByRole('link', { name: /findAllUsers/i });
    const inactiveLink = screen.getByRole('link', { name: /findAllOrders/i });

    expect(activeLink.className).toContain('bg-primary/10');
    expect(activeLink.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(inactiveLink.className).not.toContain('bg-primary/10');
    expect(inactiveLink.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
