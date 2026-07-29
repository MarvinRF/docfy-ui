// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestPanel } from './RequestPanel';
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
    security: [],
    ...overrides,
  };
}

describe('<RequestPanel />', () => {
  it('renders the method and path', () => {
    render(<RequestPanel endpoint={makeEndpoint()} baseUrl="https://api.example.com" />);
    const header = screen.getByTestId('request-panel-header');
    expect(within(header).getByText('GET')).toBeInTheDocument();
    expect(within(header).getByText('/users')).toBeInTheDocument();
  });

  it('defaults to the first snippet language (curl)', () => {
    const { container } = render(<RequestPanel endpoint={makeEndpoint()} baseUrl="https://api.example.com" />);
    expect(container.querySelector('code')?.textContent).toBe(`curl -X GET 'https://api.example.com/users'`);
  });

  it('switches the snippet when a different language tab is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<RequestPanel endpoint={makeEndpoint()} baseUrl="https://api.example.com" />);

    await user.click(screen.getByRole('tab', { name: 'Python' }));
    expect(container.querySelector('code')?.textContent).toMatch(/import requests/);
  });

  it('switches to the Try it out form and sends an enabled request', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<RequestPanel endpoint={makeEndpoint()} baseUrl="https://api.example.com" />);
    await user.click(screen.getByRole('tab', { name: 'Try it out' }));

    const sendButton = screen.getByRole('button', { name: 'Send' });
    expect(sendButton).toBeEnabled();
    await user.click(sendButton);

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users', expect.objectContaining({ method: 'GET' }));
    vi.unstubAllGlobals();
  });

  it('renders a copy button for the current snippet', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<RequestPanel endpoint={makeEndpoint()} baseUrl="https://api.example.com" />);
    await user.click(screen.getByRole('button', { name: 'Copy snippet' }));

    expect(writeText).toHaveBeenCalledWith(`curl -X GET 'https://api.example.com/users'`);
  });
});
