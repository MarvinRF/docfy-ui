// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecurityNotices } from './SecurityNotices';
import { HOST_CONFIG_ELEMENT_ID } from '../lib/host-config';

function setNotices(notices: string[] | undefined) {
  const el = document.createElement('script');
  el.type = 'application/json';
  el.id = HOST_CONFIG_ELEMENT_ID;
  el.textContent = JSON.stringify({ securityNotices: notices });
  document.head.appendChild(el);
}

afterEach(() => document.getElementById(HOST_CONFIG_ELEMENT_ID)?.remove());

describe('<SecurityNotices />', () => {
  it('renders nothing when the host sent no notices', () => {
    setNotices(undefined);
    const { container } = render(<SecurityNotices />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists every notice and can be dismissed', async () => {
    setNotices(['Proxy has no authorization.', 'CSP disabled.']);
    render(<SecurityNotices />);
    expect(screen.getByRole('status')).toHaveTextContent('Proxy has no authorization.');
    expect(screen.getByRole('status')).toHaveTextContent('CSP disabled.');

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss security notices' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
