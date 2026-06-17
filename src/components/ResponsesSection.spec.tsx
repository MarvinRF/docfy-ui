// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsesSection } from './ResponsesSection';
import type { ResponseInfo } from '../document-model/types';

describe('<ResponsesSection />', () => {
  it('renders nothing when there are no responses', () => {
    const { container } = render(<ResponsesSection responses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one card per response, in declaration order', () => {
    const responses: ResponseInfo[] = [
      { status: '200', description: 'OK', contentType: undefined, schema: undefined },
      { status: '404', description: 'Not found', contentType: undefined, schema: undefined },
    ];
    render(<ResponsesSection responses={responses} />);

    const codes = screen.getAllByText(/^(200|404)$/).map((el) => el.textContent);
    expect(codes).toEqual(['200', '404']);
  });

  it('falls back to standard status text when description is missing', () => {
    render(<ResponsesSection responses={[{ status: '500', description: undefined, contentType: undefined, schema: undefined }]} />);
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('renders the content-type when present', () => {
    render(<ResponsesSection responses={[{ status: '200', description: 'OK', contentType: 'application/json', schema: undefined }]} />);
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });

  it('renders a schema tree when the response has a schema', () => {
    render(
      <ResponsesSection
        responses={[{ status: '200', description: 'OK', contentType: 'application/json', schema: { type: 'object', properties: { id: { type: 'string' } } } }]}
      />,
    );
    expect(screen.getByText('id')).toBeInTheDocument();
  });
});
