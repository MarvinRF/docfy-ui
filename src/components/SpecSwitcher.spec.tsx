// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecSwitcher } from './SpecSwitcher';
import { useSpecStore } from '../state/spec-store';

describe('<SpecSwitcher />', () => {
  beforeEach(() => {
    useSpecStore.setState({ specs: [], currentUrl: '/api-json' });
  });

  it('renders nothing when fewer than two specs are configured', () => {
    useSpecStore.setState({ specs: [{ name: 'users', url: '/users/api-json' }], currentUrl: '/users/api-json' });
    const { container } = render(<SpecSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a select with one option per configured spec', () => {
    useSpecStore.setState({
      specs: [
        { name: 'users-service', url: '/users/api-json' },
        { name: 'orders-service', url: '/orders/api-json' },
      ],
      currentUrl: '/users/api-json',
    });
    render(<SpecSwitcher />);

    const select = screen.getByRole('combobox', { name: /switch spec/i });
    expect(select).toHaveValue('/users/api-json');
    expect(screen.getByRole('option', { name: 'users-service' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'orders-service' })).toBeInTheDocument();
  });

  it('calls setCurrentUrl when a different spec is selected', async () => {
    const user = userEvent.setup();
    useSpecStore.setState({
      specs: [
        { name: 'users-service', url: '/users/api-json' },
        { name: 'orders-service', url: '/orders/api-json' },
      ],
      currentUrl: '/users/api-json',
    });
    render(<SpecSwitcher />);

    await user.selectOptions(screen.getByRole('combobox', { name: /switch spec/i }), 'orders-service');
    expect(useSpecStore.getState().currentUrl).toBe('/orders/api-json');
  });
});
