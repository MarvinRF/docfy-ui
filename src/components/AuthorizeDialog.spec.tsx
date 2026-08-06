// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthorizeDialog } from './AuthorizeDialog';
import { useTryItStore } from '../state/try-it-store';
import type { SecuritySchemeInfo } from '../document-model/types';

const BEARER: SecuritySchemeInfo = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  in: undefined,
  name: undefined,
  description: undefined,
};

const API_KEY: SecuritySchemeInfo = {
  type: 'apiKey',
  scheme: undefined,
  bearerFormat: undefined,
  in: 'header',
  name: 'X-API-Key',
  description: undefined,
};

describe('<AuthorizeDialog />', () => {
  beforeEach(() => {
    localStorage.clear();
    useTryItStore.setState({ authValues: {}, requests: {} });
  });

  it('lists every declared security scheme, not just ones a single endpoint requires', () => {
    render(
      <AuthorizeDialog open onOpenChange={() => {}} securitySchemes={{ bearerAuth: BEARER, apiKeyAuth: API_KEY }} />,
    );

    expect(screen.getByText(/bearerAuth/)).toBeInTheDocument();
    expect(screen.getByText(/apiKeyAuth/)).toBeInTheDocument();
  });

  it('shows a message when the spec declares no security scheme', () => {
    render(<AuthorizeDialog open onOpenChange={() => {}} securitySchemes={{}} />);
    expect(screen.getByText(/doesn't declare any security scheme/)).toBeInTheDocument();
  });

  it('typing a value writes to the shared try-it-store, reused by every request', async () => {
    const user = userEvent.setup();
    render(<AuthorizeDialog open onOpenChange={() => {}} securitySchemes={{ bearerAuth: BEARER }} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'my-jwt-token');

    expect(useTryItStore.getState().authValues.bearerAuth).toBe('my-jwt-token');
  });

  it('does not render an input for cookie-based apiKey auth', () => {
    const cookieScheme: SecuritySchemeInfo = { ...API_KEY, in: 'cookie' };
    render(<AuthorizeDialog open onOpenChange={() => {}} securitySchemes={{ cookieAuth: cookieScheme }} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Cookie auth isn't supported/)).toBeInTheDocument();
  });
});
