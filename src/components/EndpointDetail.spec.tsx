// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EndpointDetail, type EndpointDetailProps } from './EndpointDetail';
import type { Endpoint } from '../document-model/types';

function renderEndpointDetail(props: EndpointDetailProps, initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <EndpointDetail {...props} />
    </MemoryRouter>,
  );
}

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'POST',
    path: '/auth/register',
    operationId: 'register',
    summary: 'Register a new account',
    description: 'Register a new account.',
    tags: ['auth'],
    parameters: [],
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
    },
    responses: [
      {
        status: '201',
        description: 'Created',
        contentType: 'application/json',
        schema: { type: 'object', properties: { id: { type: 'string' } } },
      },
      { status: '400', description: 'Validation Error', contentType: undefined, schema: undefined },
    ],
    security: [],
    ...overrides,
  };
}

describe('<EndpointDetail />', () => {
  it('renders the operation title and all three action buttons', () => {
    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    expect(screen.getByRole('heading', { name: 'Register a new account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy OpenAPI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy as a Prompt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy MCP Reference' })).toBeInTheDocument();
  });

  it('renders the request panel with the right method/path', () => {
    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    // Rendered twice — a sticky `xl:block` panel and an `xl:hidden` one for narrower
    // screens, mirroring the reference's responsive layout (both exist in the DOM;
    // CSS alone decides which one is visible at a given breakpoint).
    const headers = screen.getAllByTestId('request-panel-header');
    expect(headers).toHaveLength(2);
    for (const header of headers) {
      expect(within(header).getByText('POST')).toBeInTheDocument();
      expect(within(header).getByText('/auth/register')).toBeInTheDocument();
    }
  });

  it('renders the request body section with the declared schema', () => {
    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    const section = screen.getByTestId('request-body-section');
    expect(within(section).getByText('Request Body')).toBeInTheDocument();
    expect(section.textContent).toMatch(/"email": "string"/);
  });

  it('renders the responses section with both declared statuses', () => {
    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    const section = screen.getByTestId('responses-section');
    expect(within(section).getByText('201')).toBeInTheDocument();
    expect(within(section).getByText('400')).toBeInTheDocument();
  });

  it('"Copy OpenAPI" copies valid JSON for the endpoint', async () => {
    const user = userEvent.setup();
    let copiedText = '';
    const writeText = (text: string) => {
      copiedText = text;
      return Promise.resolve();
    };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    await user.click(screen.getByRole('button', { name: 'Copy OpenAPI' }));

    expect(() => JSON.parse(copiedText)).not.toThrow();
    const parsed = JSON.parse(copiedText);
    expect(parsed.method).toBe('POST');
    expect(parsed.path).toBe('/auth/register');
  });

  it('"Copy as a Prompt" copies the operationToAiText() output', async () => {
    const user = userEvent.setup();
    let copiedText = '';
    const writeText = (text: string) => {
      copiedText = text;
      return Promise.resolve();
    };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    await user.click(screen.getByRole('button', { name: 'Copy as a Prompt' }));

    expect(copiedText).toContain('Endpoint: POST /auth/register');
    expect(copiedText).toContain('Success Response (201):');
  });

  it('"Copy MCP Reference" copies method+path and the current page URL', async () => {
    const user = userEvent.setup();
    let copiedText = '';
    const writeText = (text: string) => {
      copiedText = text;
      return Promise.resolve();
    };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' });
    await user.click(screen.getByRole('button', { name: 'Copy MCP Reference' }));

    expect(copiedText).toBe(`POST /auth/register\n${window.location.href}`);
  });

  it('handles a circular schema (recursive DTO) without crashing', async () => {
    const recursive: Record<string, unknown> = { type: 'object', properties: {} };
    (recursive.properties as Record<string, unknown>).parent = recursive;

    const endpoint = makeEndpoint({
      requestBody: { required: true, contentType: 'application/json', schema: recursive },
    });

    const user = userEvent.setup();
    let copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: (text: string) => {
          copiedText = text;
          return Promise.resolve();
        },
      },
      configurable: true,
    });

    renderEndpointDetail({ endpoint: endpoint, baseUrl: 'https://api.example.com' });
    await user.click(screen.getByRole('button', { name: 'Copy OpenAPI' }));

    expect(() => JSON.parse(copiedText)).not.toThrow();
  });

  describe('deep-linking into a nested schema property via the URL hash', () => {
    it('opens the targeted response, activates its Schema tab, and expands to the target property', () => {
      const endpoint = makeEndpoint({
        responses: [
          {
            status: '201',
            description: 'Created',
            contentType: 'application/json',
            schema: {
              type: 'object',
              properties: { address: { type: 'object', properties: { city: { type: 'string' } } } },
            },
          },
          { status: '400', description: 'Validation Error', contentType: undefined, schema: undefined },
        ],
      });

      renderEndpointDetail({ endpoint, baseUrl: 'https://api.example.com' }, [
        '/auth/register#response-201/address/city',
      ]);

      // Two ResponseCards (201, 400) plus the RequestBodySection each have
      // their own Example/Schema tabs — scope to the 201 card specifically.
      // ("201" also appears in the sidebar ResponseViewer, so scope the
      // lookup to the Responses section first.)
      const responsesSection = screen.getByTestId('responses-section');
      const card = within(responsesSection).getByText('201').closest('div.overflow-hidden') as HTMLElement;
      expect(within(card).getByRole('tab', { name: 'Schema' })).toHaveAttribute('data-state', 'active');
      expect(within(card).getByText('city')).toBeInTheDocument();
    });

    it('leaves the page in its default state for a hash with no matching scope', () => {
      renderEndpointDetail({ endpoint: makeEndpoint(), baseUrl: 'https://api.example.com' }, [
        '/auth/register#response-999/nothing',
      ]);

      // Request body + every response card default to their Example tab —
      // none of them is force-activated to Schema by an unmatched hash.
      const exampleTabs = screen.getAllByRole('tab', { name: 'Example' });
      expect(exampleTabs.length).toBeGreaterThan(0);
      for (const tab of exampleTabs) {
        expect(tab).toHaveAttribute('data-state', 'active');
      }
    });
  });
});
