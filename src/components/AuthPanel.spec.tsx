// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthPanel } from './AuthPanel';
import { useTryItStore } from '../state/try-it-store';
import type { SecuritySchemeInfo } from '../document-model/types';

const SCHEMES: Record<string, SecuritySchemeInfo> = {
  bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: undefined, name: undefined, description: undefined },
  basicAuth: { type: 'http', scheme: 'basic', bearerFormat: undefined, in: undefined, name: undefined, description: undefined },
  apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key', scheme: undefined, bearerFormat: undefined, description: undefined },
  cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session', scheme: undefined, bearerFormat: undefined, description: undefined },
};

describe('<AuthPanel />', () => {
  beforeEach(() => {
    useTryItStore.setState({ authValues: {}, requests: {} });
  });

  it('renders nothing when the endpoint has no security requirements', () => {
    const { container } = render(<AuthPanel security={[]} securitySchemes={SCHEMES} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one input per distinct scheme referenced across alternatives', () => {
    render(<AuthPanel security={[{ bearerAuth: [] }, { apiKeyAuth: [] }]} securitySchemes={SCHEMES} />);
    expect(screen.getByText(/bearerAuth/)).toBeInTheDocument();
    expect(screen.getByText(/apiKeyAuth/)).toBeInTheDocument();
  });

  it('writes typed values into the global try-it-store, keyed by scheme name', async () => {
    const user = userEvent.setup();
    render(<AuthPanel security={[{ bearerAuth: [] }]} securitySchemes={SCHEMES} />);

    const input = screen.getByPlaceholderText('value');
    await user.type(input, 'token123');

    expect(useTryItStore.getState().authValues.bearerAuth).toBe('token123');
  });

  it('shows a user:pass placeholder for http basic', () => {
    render(<AuthPanel security={[{ basicAuth: [] }]} securitySchemes={SCHEMES} />);
    expect(screen.getByPlaceholderText('user:pass')).toBeInTheDocument();
  });

  it('shows an unsupported notice instead of an input for cookie-based apiKey', () => {
    render(<AuthPanel security={[{ cookieAuth: [] }]} securitySchemes={SCHEMES} />);
    expect(screen.getByText(/isn't supported/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
