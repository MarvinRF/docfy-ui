// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparePage } from './ComparePage';

function specWithPaths(paths: Record<string, unknown>) {
  return { openapi: '3.0.3', info: { title: 'Test', version: '1.0.0' }, paths };
}

const getUsers = {
  get: { operationId: 'findAllUsers', tags: ['users'], responses: { '200': { description: 'OK' } } },
};

function mockFetchSequence(bodies: unknown[]) {
  let call = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      const body = bodies[call];
      call += 1;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<ComparePage />', () => {
  it('prefills the "New spec" field with currentSpecUrl', () => {
    render(<ComparePage currentSpecUrl="/api-json" />);
    expect(screen.getByLabelText(/New spec/i)).toHaveValue('/api-json');
  });

  it('reports no differences when both specs are identical', async () => {
    const user = userEvent.setup();
    mockFetchSequence([specWithPaths({ '/users': getUsers }), specWithPaths({ '/users': getUsers })]);
    render(<ComparePage currentSpecUrl="/api-json" />);

    await user.type(screen.getByLabelText(/Base spec/i), 'https://old.example.com/api-json');
    await user.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(screen.getByText(/no differences found/i)).toBeInTheDocument();
    });
  });

  it('reports a breaking change when an endpoint is removed', async () => {
    const user = userEvent.setup();
    mockFetchSequence([specWithPaths({ '/users': getUsers }), specWithPaths({})]);
    render(<ComparePage currentSpecUrl="/api-json" />);

    await user.type(screen.getByLabelText(/Base spec/i), 'https://old.example.com/api-json');
    await user.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 breaking change/i)).toBeInTheDocument();
    });
    expect(screen.getByText('/users')).toBeInTheDocument();
  });

  it('shows an error message when a fetch fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' })),
    );
    render(<ComparePage currentSpecUrl="/api-json" />);

    await user.type(screen.getByLabelText(/Base spec/i), 'https://old.example.com/api-json');
    await user.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });
});
