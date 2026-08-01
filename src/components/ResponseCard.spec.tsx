// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseCard } from './ResponseCard';

describe('<ResponseCard />', () => {
  it('renders the status code and label', () => {
    render(
      <ResponseCard
        response={{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }}
      />,
    );
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('falls back to standard status text when description is missing', () => {
    render(
      <ResponseCard response={{ status: '500', description: undefined, contentType: undefined, schema: undefined }} />,
    );
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('is collapsed by default and expands the JSON body on click', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResponseCard
        response={{
          status: '200',
          description: 'OK',
          contentType: 'application/json',
          schema: { type: 'object', properties: { id: { type: 'string' } } },
        }}
      />,
    );

    expect(container.querySelector('code')?.textContent).toMatch(/"id": "string"/);
    const body = container.querySelector('.grid');
    expect(body?.className).toContain('grid-rows-[0fr]');

    await user.click(screen.getByRole('button', { name: /200/ }));
    expect(body?.className).toContain('grid-rows-[1fr]');
  });

  it('respects defaultOpen', () => {
    const { container } = render(
      <ResponseCard
        response={{ status: '200', description: 'OK', contentType: undefined, schema: undefined }}
        defaultOpen
      />,
    );
    const body = container.querySelector('.grid');
    expect(body?.className).toContain('grid-rows-[1fr]');
  });

  it('shows a "No content" placeholder when the response has no schema', () => {
    const { container } = render(
      <ResponseCard
        response={{ status: '204', description: 'No Content', contentType: undefined, schema: undefined }}
      />,
    );
    expect(container.querySelector('code')?.textContent).toMatch(/No content/);
  });

  describe('Example / Schema tabs', () => {
    const response = {
      status: '200',
      description: 'OK',
      contentType: 'application/json',
      schema: {
        type: 'object' as const,
        properties: { address: { type: 'object', properties: { city: { type: 'string' } } } },
      },
    };

    it('defaults to the Example tab, switches to Schema on click', async () => {
      const user = userEvent.setup();
      render(<ResponseCard response={response} defaultOpen />);

      expect(screen.getByRole('tab', { name: 'Example' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: 'Schema' })).toHaveAttribute('data-state', 'inactive');

      await user.click(screen.getByRole('tab', { name: 'Schema' }));
      expect(screen.getByText('address')).toBeInTheDocument();
    });

    it('when activeTarget matches this response, opens the card with the Schema tab active and expanded to the target', () => {
      render(<ResponseCard response={response} activeTarget={{ scope: 'response-200', path: ['address', 'city'] }} />);

      expect(screen.getByRole('tab', { name: 'Schema' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('city')).toBeInTheDocument();
    });

    it('ignores an activeTarget scoped to a different response status', () => {
      const { container } = render(
        <ResponseCard response={response} activeTarget={{ scope: 'response-404', path: ['message'] }} />,
      );

      expect(screen.getByRole('tab', { name: 'Example' })).toHaveAttribute('data-state', 'active');
      // Card stays collapsed (CSS grid-rows-[0fr]), not force-opened by a target elsewhere.
      const body = container.querySelector('.grid');
      expect(body?.className).toContain('grid-rows-[0fr]');
    });
  });
});
