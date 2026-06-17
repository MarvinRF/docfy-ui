// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';

describe('<CopyButton />', () => {
  it('renders the given label', () => {
    render(<CopyButton text="hello" label="Copy OpenAPI" />);
    expect(screen.getByRole('button', { name: 'Copy OpenAPI' })).toBeInTheDocument();
  });

  it('copies the text and shows "Copied!" on click', async () => {
    // userEvent.setup() installs its own clipboard stub on navigator.clipboard —
    // our mock must be defined AFTER setup(), or setup() clobbers it.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<CopyButton text="hello" label="Copy OpenAPI" />);

    await user.click(screen.getByRole('button', { name: 'Copy OpenAPI' }));

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });
});
