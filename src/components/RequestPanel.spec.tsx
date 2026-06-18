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

  it('renders the Test Request button as disabled', () => {
    render(<RequestPanel endpoint={makeEndpoint()} baseUrl="https://api.example.com" />);
    expect(screen.getByRole('button', { name: 'Test Request' })).toBeDisabled();
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
