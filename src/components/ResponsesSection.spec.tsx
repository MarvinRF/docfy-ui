// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ResponsesSection } from './ResponsesSection';
import type { ResponseInfo } from '../document-model/types';

describe('<ResponsesSection />', () => {
  it('renders nothing when there are no responses', () => {
    const { container } = render(<ResponsesSection responses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one row per response, in declaration order', () => {
    const responses: ResponseInfo[] = [
      { status: '200', description: 'OK', contentType: undefined, schema: undefined },
      { status: '404', description: 'Not found', contentType: undefined, schema: undefined },
    ];
    render(<ResponsesSection responses={responses} />);

    const codes = screen.getAllByText(/^(200|404)$/).map((el) => el.textContent);
    expect(codes).toEqual(['200', '404']);
  });

  it('falls back to standard status text when description is missing', () => {
    render(
      <ResponsesSection
        responses={[{ status: '500', description: undefined, contentType: undefined, schema: undefined }]}
      />,
    );
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('opens only the first row by default', () => {
    const { container } = render(
      <ResponsesSection
        responses={[
          { status: '200', description: 'OK', contentType: undefined, schema: undefined },
          { status: '404', description: 'Not found', contentType: undefined, schema: undefined },
        ]}
      />,
    );
    const bodies = container.querySelectorAll('.grid');
    expect(bodies[0]?.className).toContain('grid-rows-[1fr]');
    expect(bodies[1]?.className).toContain('grid-rows-[0fr]');
  });

  it('forwards activeTarget only to the response card whose scope matches', () => {
    const responses: ResponseInfo[] = [
      {
        status: '200',
        description: 'OK',
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: { address: { type: 'object', properties: { city: { type: 'string' } } } },
        },
      },
      { status: '404', description: 'Not found', contentType: undefined, schema: undefined },
    ];
    render(
      <ResponsesSection responses={responses} activeTarget={{ scope: 'response-200', path: ['address', 'city'] }} />,
    );

    const card200 = screen.getByText('200').closest('div.overflow-hidden') as HTMLElement;
    expect(within(card200).getByRole('tab', { name: 'Schema' })).toHaveAttribute('data-state', 'active');

    const card404 = screen.getByText('404').closest('div.overflow-hidden') as HTMLElement;
    expect(within(card404).getByRole('tab', { name: 'Example' })).toHaveAttribute('data-state', 'active');
  });
});
