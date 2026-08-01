// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestBodySection } from './RequestBodySection';

describe('<RequestBodySection />', () => {
  it('renders nothing when there is no request body', () => {
    const { container } = render(<RequestBodySection requestBody={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the schema as a type-token JSON example', () => {
    render(
      <RequestBodySection
        requestBody={{
          required: true,
          contentType: 'application/json',
          schema: { type: 'object', properties: { email: { type: 'string' } } },
        }}
      />,
    );
    expect(screen.getByText('Request Body')).toBeInTheDocument();
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.getByTestId('request-body-section').textContent).toMatch(/"email": "string"/);
  });

  it('shows a "No content" placeholder when the body has no schema', () => {
    render(
      <RequestBodySection requestBody={{ required: false, contentType: 'application/json', schema: undefined }} />,
    );
    expect(screen.getByTestId('request-body-section').textContent).toMatch(/No content/);
  });

  it('does not show "required" when the body is optional', () => {
    render(
      <RequestBodySection
        requestBody={{ required: false, contentType: 'application/json', schema: { type: 'string' } }}
      />,
    );
    expect(screen.queryByText('required')).not.toBeInTheDocument();
  });

  describe('Example / Schema tabs', () => {
    const requestBody = {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object' as const,
        properties: { address: { type: 'object', properties: { city: { type: 'string' } } } },
      },
    };

    it('defaults to the Example tab, switches to Schema on click', async () => {
      const user = userEvent.setup();
      render(<RequestBodySection requestBody={requestBody} />);

      expect(screen.getByRole('tab', { name: 'Example' })).toHaveAttribute('data-state', 'active');
      await user.click(screen.getByRole('tab', { name: 'Schema' }));
      expect(screen.getByText('address')).toBeInTheDocument();
    });

    it('when activeTarget scopes to request-body, activates the Schema tab expanded to the target', () => {
      render(
        <RequestBodySection
          requestBody={requestBody}
          activeTarget={{ scope: 'request-body', path: ['address', 'city'] }}
        />,
      );

      expect(screen.getByRole('tab', { name: 'Schema' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('city')).toBeInTheDocument();
    });

    it('ignores an activeTarget scoped to a response instead of the request body', () => {
      render(
        <RequestBodySection
          requestBody={requestBody}
          activeTarget={{ scope: 'response-200', path: ['address', 'city'] }}
        />,
      );
      expect(screen.getByRole('tab', { name: 'Example' })).toHaveAttribute('data-state', 'active');
    });
  });
});
