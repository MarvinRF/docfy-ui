// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SearchModal } from './SearchModal';
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

const TAG_GROUPS: TagGroup[] = [
  { name: 'users', description: undefined, endpoints: [makeEndpoint()] },
  { name: 'orders', description: undefined, endpoints: [makeEndpoint({ path: '/orders', operationId: 'findAllOrders' })] },
];

function renderModal(open: boolean, onOpenChange: (open: boolean) => void, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SearchModal open={open} onOpenChange={onOpenChange} tagGroups={TAG_GROUPS} />
      <Routes>
        <Route path="/:tag/:operationId" element={<p>endpoint page</p>} />
        <Route path="*" element={<p>empty state</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<SearchModal />', () => {
  it('renders nothing when closed', () => {
    renderModal(false, () => {});
    expect(screen.queryByPlaceholderText(/search endpoints/i)).not.toBeInTheDocument();
  });

  it('lists endpoints grouped by tag when open', () => {
    renderModal(true, () => {});
    expect(screen.getByText('/users')).toBeInTheDocument();
    expect(screen.getByText('/orders')).toBeInTheDocument();
  });

  it('filters results as the user types, reusing the same matching rules as the sidebar', async () => {
    const user = userEvent.setup();
    renderModal(true, () => {});

    await user.type(screen.getByPlaceholderText(/search endpoints/i), 'orders');

    expect(screen.queryByText('/users')).not.toBeInTheDocument();
    expect(screen.getByText('/orders')).toBeInTheDocument();
  });

  it('navigates to the selected endpoint and closes on select', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderModal(true, onOpenChange);

    await user.click(screen.getByText('/orders'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('endpoint page')).toBeInTheDocument();
  });
});
