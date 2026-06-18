// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseCard } from './ResponseCard';

describe('<ResponseCard />', () => {
  it('renders the status code and label', () => {
    render(<ResponseCard response={{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }} />);
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('falls back to standard status text when description is missing', () => {
    render(<ResponseCard response={{ status: '500', description: undefined, contentType: undefined, schema: undefined }} />);
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('is collapsed by default and expands the JSON body on click', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResponseCard
        response={{ status: '200', description: 'OK', contentType: 'application/json', schema: { type: 'object', properties: { id: { type: 'string' } } } }}
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
      <ResponseCard response={{ status: '200', description: 'OK', contentType: undefined, schema: undefined }} defaultOpen />,
    );
    const body = container.querySelector('.grid');
    expect(body?.className).toContain('grid-rows-[1fr]');
  });

  it('shows a "No content" placeholder when the response has no schema', () => {
    const { container } = render(<ResponseCard response={{ status: '204', description: 'No Content', contentType: undefined, schema: undefined }} />);
    expect(container.querySelector('code')?.textContent).toMatch(/No content/);
  });
});
