// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

describe('<CodeBlock />', () => {
  it('renders the code content', () => {
    render(<CodeBlock code="const x = 1;" language="javascript" />);
    expect(screen.getByText(/const/)).toBeInTheDocument();
  });

  it('shows a copy button by default and copies the code on click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="hello" language="json" variant="inline" />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('hides the header entirely when no label and showCopy is false', () => {
    render(<CodeBlock code="hello" language="json" showCopy={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
