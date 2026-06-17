// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MethodBadge } from './MethodBadge';

describe('<MethodBadge />', () => {
  it('renders the method in uppercase', () => {
    render(<MethodBadge method="get" />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('applies a distinct color class per method', () => {
    render(<MethodBadge method="POST" />);
    expect(screen.getByText('POST').className).toContain('green');
  });

  it('falls back to a default color for an unrecognized method', () => {
    render(<MethodBadge method="TRACE" />);
    expect(screen.getByText('TRACE').className).toContain('gray');
  });
});
