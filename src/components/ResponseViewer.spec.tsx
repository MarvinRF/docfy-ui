// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseViewer } from './ResponseViewer';

describe('<ResponseViewer />', () => {
  it('shows a fallback message when there is no response', () => {
    render(<ResponseViewer response={undefined} />);
    expect(screen.getByText(/no success response declared/i)).toBeInTheDocument();
  });

  it('shows the example JSON on the Response tab by default', () => {
    const { container } = render(
      <ResponseViewer
        response={{ status: '200', description: 'OK', contentType: 'application/json', schema: { type: 'object', properties: { id: { type: 'string' } } } }}
      />,
    );
    expect(container.querySelector('code')?.textContent).toMatch(/"id": "string"/);
  });

  it('switches to the schema tree on the Schema tab', async () => {
    const user = userEvent.setup();
    render(
      <ResponseViewer
        response={{ status: '200', description: 'OK', contentType: 'application/json', schema: { type: 'object', properties: { id: { type: 'string' } } } }}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'schema' }));
    expect(screen.getByText('id')).toBeInTheDocument();
  });

  it('shows "No content" on the Response tab when the response has no schema', () => {
    render(<ResponseViewer response={{ status: '204', description: 'No Content', contentType: undefined, schema: undefined }} />);
    expect(screen.getByText('No content')).toBeInTheDocument();
  });
});
