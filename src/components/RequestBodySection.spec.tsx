// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    render(<RequestBodySection requestBody={{ required: false, contentType: 'application/json', schema: undefined }} />);
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
});
