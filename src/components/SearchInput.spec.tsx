// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('<SearchInput />', () => {
  it('renders the current value', () => {
    render(<SearchInput value="users" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('users');
  });

  it('calls onChange on every keystroke, no debounce/Enter required', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'us' } });
    expect(onChange).toHaveBeenCalledWith('us');
  });
});
