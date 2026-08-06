// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useNavigationStore } from '../state/navigation-store';
import { useSpecStore } from '../state/spec-store';
import { useTryItStore } from '../state/try-it-store';
import type { Endpoint, SecuritySchemeInfo, TagGroup } from '../document-model/types';

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
    security: [],
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
    securitySchemes: Record<string, SecuritySchemeInfo>;
  }> = {},
) {
  return render(
    <MemoryRouter initialEntries={[overrides.initialPath ?? '/']}>
      <Sidebar
        tagGroups={tagGroups}
        securitySchemes={overrides.securitySchemes}
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
    renderSidebar([
      {
        name: 'users',
        description: undefined,
        endpoints: [makeEndpoint({ method: 'POST', summary: 'Create a user' })],
      },
    ]);
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('Create a user')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Create a user/i });
    const label = within(link).getByText('Create a user');
    const badge = within(link).getByText('POST');
    // Title comes first in the DOM (left), method badge second (right) — matches the reference layout.
    expect(label.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('falls back to the operationId as the title when summary is missing', () => {
    renderSidebar([
      {
        name: 'users',
        description: undefined,
        endpoints: [makeEndpoint({ operationId: 'findAllUsers', summary: undefined })],
      },
    ]);
    expect(screen.getByText('findAllUsers')).toBeInTheDocument();
  });

  it('collapses and expands a tag section on click', async () => {
    const user = userEvent.setup();
    renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint()] }]);

    expect(screen.getByText('findAllUsers')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'users' }));
    expect(screen.queryByText('findAllUsers')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'users' }));
    expect(screen.getByText('findAllUsers')).toBeInTheDocument();
  });

  it('links to /:tag/:operationId for each endpoint', () => {
    renderSidebar([
      { name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] },
    ]);
    const link = screen.getByRole('link', { name: /findAllUsers/i });
    expect(link).toHaveAttribute('href', '/users/findAllUsers');
  });

  it('keeps each tag group scoped to its own endpoints', () => {
    const groups: TagGroup[] = [
      { name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] },
      {
        name: 'orders',
        description: undefined,
        endpoints: [makeEndpoint({ path: '/orders', operationId: 'findAllOrders' })],
      },
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
      {
        name: 'orders',
        description: undefined,
        endpoints: [makeEndpoint({ path: '/orders', operationId: 'findAllOrders' })],
      },
    ];
    renderSidebar(groups, { initialPath: '/users/findAllUsers' });

    const activeLink = screen.getByRole('link', { name: /findAllUsers/i });
    const inactiveLink = screen.getByRole('link', { name: /findAllOrders/i });

    expect(activeLink.className).toContain('bg-primary/10');
    expect(activeLink.querySelector('[data-testid="active-indicator"]')).not.toBeNull();
    expect(inactiveLink.className).not.toContain('bg-primary/10');
    expect(inactiveLink.querySelector('[data-testid="active-indicator"]')).toBeNull();
  });

  it('links to /compare for the "Compare specs" entry', () => {
    renderSidebar([]);
    const link = screen.getByRole('link', { name: /Compare specs/i });
    expect(link).toHaveAttribute('href', '/compare');
  });

  describe('Guides section', () => {
    afterEach(() => {
      delete (window as { __DOCFY_GUIDES__?: unknown }).__DOCFY_GUIDES__;
    });

    it('renders no "Guides" nav when none are configured', () => {
      renderSidebar([]);
      expect(screen.queryByRole('navigation', { name: 'Guides' })).not.toBeInTheDocument();
    });

    it('lists each configured guide, linking to /guides/:slug', () => {
      window.__DOCFY_GUIDES__ = [
        { slug: 'getting-started', title: 'Getting Started', content: '# Hi' },
        { slug: 'auth', title: 'Authentication', content: '# Auth' },
      ];
      renderSidebar([]);

      const nav = screen.getByRole('navigation', { name: 'Guides' });
      const link = within(nav).getByRole('link', { name: 'Getting Started' });
      expect(link).toHaveAttribute('href', '/guides/getting-started');
      expect(within(nav).getByRole('link', { name: 'Authentication' })).toHaveAttribute('href', '/guides/auth');
    });

    it('highlights the guide link matching the current route', () => {
      window.__DOCFY_GUIDES__ = [{ slug: 'getting-started', title: 'Getting Started', content: '# Hi' }];
      renderSidebar([], { initialPath: '/guides/getting-started' });

      const link = screen.getByRole('link', { name: 'Getting Started' });
      expect(link.className).toContain('bg-primary/10');
    });
  });

  describe('Favorites and recent', () => {
    afterEach(() => {
      useNavigationStore.setState({ favorites: {}, recent: {} });
    });

    it('renders no Favorites/Recent nav when nothing is starred or visited', () => {
      renderSidebar([{ name: 'users', description: undefined, endpoints: [makeEndpoint()] }]);
      expect(screen.queryByRole('navigation', { name: 'Favorites' })).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Recently viewed' })).not.toBeInTheDocument();
    });

    it('stars an endpoint via the row toggle, adding it to Favorites, then unstars it', async () => {
      const user = userEvent.setup();
      const groups: TagGroup[] = [
        { name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] },
      ];
      renderSidebar(groups);

      await user.click(screen.getByRole('button', { name: 'Add findAllUsers to favorites' }));

      const favNav = screen.getByRole('navigation', { name: 'Favorites' });
      expect(within(favNav).getByRole('link', { name: /findAllUsers/i })).toBeInTheDocument();

      await user.click(within(favNav).getByRole('button', { name: 'Remove findAllUsers from favorites' }));
      expect(screen.queryByRole('navigation', { name: 'Favorites' })).not.toBeInTheDocument();
    });

    it('lists recently visited endpoints, excluding ones already favorited', () => {
      const groups: TagGroup[] = [
        {
          name: 'users',
          description: undefined,
          endpoints: [
            makeEndpoint({ operationId: 'findAllUsers' }),
            makeEndpoint({ operationId: 'createUser', path: '/users' }),
          ],
        },
      ];
      const specUrl = useSpecStore.getState().currentUrl;
      useNavigationStore.setState({
        favorites: { [specUrl]: ['users/createUser'] },
        recent: { [specUrl]: ['users/createUser', 'users/findAllUsers'] },
      });

      renderSidebar(groups);

      const recentNav = screen.getByRole('navigation', { name: 'Recently viewed' });
      expect(within(recentNav).getByRole('link', { name: /findAllUsers/i })).toBeInTheDocument();
      expect(within(recentNav).queryByRole('link', { name: /createUser/i })).not.toBeInTheDocument();
    });

    it('the "Clear" button empties the Recent section without touching Favorites', async () => {
      const user = userEvent.setup();
      const groups: TagGroup[] = [
        { name: 'users', description: undefined, endpoints: [makeEndpoint({ operationId: 'findAllUsers' })] },
      ];
      const specUrl = useSpecStore.getState().currentUrl;
      useNavigationStore.setState({ favorites: {}, recent: { [specUrl]: ['users/findAllUsers'] } });

      renderSidebar(groups);
      expect(screen.getByRole('navigation', { name: 'Recently viewed' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Clear' }));
      expect(screen.queryByRole('navigation', { name: 'Recently viewed' })).not.toBeInTheDocument();
    });
  });

  describe('Authorize', () => {
    afterEach(() => {
      useTryItStore.setState({ authValues: {}, requests: {} });
    });

    const BEARER: SecuritySchemeInfo = {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: undefined,
      name: undefined,
      description: undefined,
    };

    it('renders no Authorize button when the spec declares no security scheme', () => {
      renderSidebar([]);
      expect(screen.queryByRole('button', { name: 'Authorize' })).not.toBeInTheDocument();
    });

    it('opens the Authorize dialog, listing every declared scheme', async () => {
      const user = userEvent.setup();
      renderSidebar([], { securitySchemes: { bearerAuth: BEARER } });

      await user.click(screen.getByRole('button', { name: 'Authorize' }));
      expect(screen.getByText(/bearerAuth/)).toBeInTheDocument();
    });
  });
});
