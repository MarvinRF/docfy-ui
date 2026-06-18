// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseViewer } from './ResponseViewer';

describe('<ResponseViewer />', () => {
  it('shows a fallback message when there are no responses', () => {
    render(<ResponseViewer responses={[]} />);
    expect(screen.getByText(/no responses declared/i)).toBeInTheDocument();
  });

  it('defaults to the primary success status and shows its example JSON', () => {
    const { container } = render(
      <ResponseViewer
        responses={[
          { status: '200', description: 'OK', contentType: 'application/json', schema: { type: 'object', properties: { id: { type: 'string' } } } },
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
          { status: '200', description: 'OK', contentType: 'application/json', schema: { type: 'object', properties: { id: { type: 'string' } } } },
          { status: '404', description: 'Not Found', contentType: undefined, schema: undefined },
        ]}
      />,
    );

    await user.click(screen.getByText('404'));
    expect(container.querySelector('code')?.textContent).toMatch(/404 — No Content/);
  });

  it('shows a "No Content" placeholder for a response with no schema', () => {
    const { container } = render(<ResponseViewer responses={[{ status: '204', description: 'No Content', contentType: undefined, schema: undefined }]} />);
    expect(container.querySelector('code')?.textContent).toMatch(/204 — No Content/);
  });
});
