// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseViewer } from './ResponseViewer';
import { useTryItStore } from '../state/try-it-store';

describe('<ResponseViewer />', () => {
  beforeEach(() => {
    localStorage.clear();
    useTryItStore.setState({ authValues: {}, requests: {} });
  });

  it('auto-switches to a "Live" tab when a try-it-store result exists for the endpoint', () => {
    useTryItStore.getState().setResult('GET /items', {
      kind: 'success',
      status: 200,
      statusText: 'OK',
      headers: [],
      bodyText: '{"ok":true}',
      durationMs: 12,
    });

    const { container } = render(
      <ResponseViewer
        responses={[{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }]}
        endpointKey="GET /items"
      />,
    );

    expect(screen.getByText(/Live · 200/)).toBeInTheDocument();
    expect(container.querySelector('code')?.textContent).toBe('{\n  "ok": true\n}');
  });

  it('pretty-prints a live JSON body regardless of how compact the raw response was', () => {
    useTryItStore.getState().setResult('GET /items', {
      kind: 'success',
      status: 200,
      statusText: 'OK',
      headers: [],
      bodyText: '{"a":1,"b":{"c":[1,2,3]}}',
      durationMs: 5,
    });

    const { container } = render(
      <ResponseViewer
        responses={[{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }]}
        endpointKey="GET /items"
      />,
    );

    expect(container.querySelector('code')?.textContent).toBe(JSON.stringify({ a: 1, b: { c: [1, 2, 3] } }, null, 2));
  });

  it('leaves a non-JSON live body unchanged instead of failing to format it', () => {
    useTryItStore.getState().setResult('GET /items', {
      kind: 'success',
      status: 200,
      statusText: 'OK',
      headers: [],
      bodyText: 'plain text response',
      durationMs: 5,
    });

    const { container } = render(
      <ResponseViewer
        responses={[{ status: '200', description: 'OK', contentType: 'text/plain', schema: undefined }]}
        endpointKey="GET /items"
      />,
    );

    expect(container.querySelector('code')?.textContent).toBe('plain text response');
  });

  it('shows the friendly network-error message in the Live tab', () => {
    useTryItStore.getState().setResult('GET /items', { kind: 'network-error', message: 'CORS or unreachable' });

    const { container } = render(
      <ResponseViewer
        responses={[{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }]}
        endpointKey="GET /items"
      />,
    );

    expect(screen.getByText('Live · Error')).toBeInTheDocument();
    expect(container.querySelector('code')?.textContent).toMatch(/CORS or unreachable/);
  });

  it('does not show a Live tab when there is no result for this endpoint', () => {
    render(
      <ResponseViewer
        responses={[{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }]}
        endpointKey="GET /other"
      />,
    );
    expect(screen.queryByText(/Live/)).not.toBeInTheDocument();
  });

  describe('"Use as ... token" button', () => {
    const bearerScheme = {
      bearerAuth: {
        type: 'http' as const,
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: undefined,
        name: undefined,
        description: undefined,
      },
    };

    it('appears when the live body contains a token-shaped field and a bearer scheme is declared', async () => {
      useTryItStore.getState().setResult('POST /auth/login', {
        kind: 'success',
        status: 201,
        statusText: 'Created',
        headers: [],
        bodyText: '{"data":{"access_token":"real-jwt-value"}}',
        durationMs: 8,
      });

      const user = userEvent.setup();
      render(<ResponseViewer responses={[]} endpointKey="POST /auth/login" securitySchemes={bearerScheme} />);

      const button = screen.getByRole('button', { name: 'Use as bearerAuth token' });
      await user.click(button);

      expect(useTryItStore.getState().authValues.bearerAuth).toBe('real-jwt-value');
      expect(screen.getByRole('button', { name: 'Used!' })).toBeInTheDocument();
    });

    it('does not appear when there is no bearer-suited scheme declared', () => {
      useTryItStore.getState().setResult('POST /auth/login', {
        kind: 'success',
        status: 201,
        statusText: 'Created',
        headers: [],
        bodyText: '{"access_token":"x"}',
        durationMs: 8,
      });

      render(<ResponseViewer responses={[]} endpointKey="POST /auth/login" securitySchemes={{}} />);
      expect(screen.queryByText(/Use as/)).not.toBeInTheDocument();
    });

    it('does not appear when the body has no token-shaped field', () => {
      useTryItStore.getState().setResult('GET /items', {
        kind: 'success',
        status: 200,
        statusText: 'OK',
        headers: [],
        bodyText: '{"id":"1"}',
        durationMs: 8,
      });

      render(<ResponseViewer responses={[]} endpointKey="GET /items" securitySchemes={bearerScheme} />);
      expect(screen.queryByText(/Use as/)).not.toBeInTheDocument();
    });
  });

  it('shows a fallback message when there are no responses', () => {
    render(<ResponseViewer responses={[]} />);
    expect(screen.getByText(/no responses declared/i)).toBeInTheDocument();
  });

  it('defaults to the primary success status and shows its example JSON', () => {
    const { container } = render(
      <ResponseViewer
        responses={[
          {
            status: '200',
            description: 'OK',
            contentType: 'application/json',
            schema: { type: 'object', properties: { id: { type: 'string' } } },
          },
          { status: '404', description: 'Not Found', contentType: undefined, schema: undefined },
        ]}
      />,
    );
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(container.querySelector('code')?.textContent).toMatch(/"id": "string"/);
  });

  it('switches the body when a different status tab is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResponseViewer
        responses={[
          {
            status: '200',
            description: 'OK',
            contentType: 'application/json',
            schema: { type: 'object', properties: { id: { type: 'string' } } },
          },
          { status: '404', description: 'Not Found', contentType: undefined, schema: undefined },
        ]}
      />,
    );

    await user.click(screen.getByText('404'));
    expect(container.querySelector('code')?.textContent).toMatch(/404 — No Content/);
  });

  it('shows a "No Content" placeholder for a response with no schema', () => {
    const { container } = render(
      <ResponseViewer
        responses={[{ status: '204', description: 'No Content', contentType: undefined, schema: undefined }]}
      />,
    );
    expect(container.querySelector('code')?.textContent).toMatch(/204 — No Content/);
  });
});
