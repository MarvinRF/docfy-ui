// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TryItForm } from './TryItForm';
import { useTryItStore } from '../state/try-it-store';
import type { Endpoint } from '../document-model/types';

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    method: 'GET',
    path: '/items/{id}',
    operationId: undefined,
    summary: undefined,
    description: undefined,
    tags: [],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: undefined },
      { name: 'verbose', in: 'query', required: false, schema: { type: 'boolean' }, description: undefined },
    ],
    requestBody: undefined,
    responses: [],
    security: [],
    ...overrides,
  };
}

describe('<TryItForm />', () => {
  beforeEach(() => {
    useTryItStore.setState({ authValues: {}, requests: {} });
  });

  it('prefills the base URL from the prop when no servers are declared', () => {
    render(<TryItForm endpoint={makeEndpoint()} baseUrl="https://api.example.com" securitySchemes={{}} />);
    expect(screen.getByLabelText('Base URL')).toHaveValue('https://api.example.com');
  });

  it('prefers the first declared server over the baseUrl prop', () => {
    render(
      <TryItForm
        endpoint={makeEndpoint()}
        baseUrl="https://api.example.com"
        securitySchemes={{}}
        servers={['https://prod.example.com', 'https://staging.example.com']}
      />,
    );
    expect(screen.getByLabelText('Base URL')).toHaveValue('https://prod.example.com');
  });

  it('renders one input per path/query parameter', () => {
    render(<TryItForm endpoint={makeEndpoint()} baseUrl="https://api.example.com" securitySchemes={{}} />);
    expect(screen.getByLabelText(/^id/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^verbose/)).toBeInTheDocument();
  });

  it('prefills the body textarea with a generated example', () => {
    const endpoint = makeEndpoint({
      requestBody: { required: true, contentType: 'application/json', schema: { type: 'object', properties: { name: { type: 'string' } } } },
    });
    render(<TryItForm endpoint={endpoint} baseUrl="https://api.example.com" securitySchemes={{}} />);
    expect((screen.getByLabelText('Body') as HTMLTextAreaElement).value).toContain('name');
  });

  it('sends the request with typed param values and shows a loading state', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; })),
    );

    render(<TryItForm endpoint={makeEndpoint()} baseUrl="https://api.example.com" securitySchemes={{}} />);
    await user.type(screen.getByLabelText(/^id/), '42');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    resolveFetch(new Response('{}', { status: 200 }));
    vi.unstubAllGlobals();
  });
});
