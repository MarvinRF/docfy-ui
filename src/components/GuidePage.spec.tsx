// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GuidePage } from './GuidePage';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/guides/:slug" element={<GuidePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<GuidePage />', () => {
  afterEach(() => {
    delete (window as { __DOCFY_GUIDES__?: unknown }).__DOCFY_GUIDES__;
  });

  it('shows "Guide not found" when no guide matches the slug', () => {
    window.__DOCFY_GUIDES__ = [];
    renderAt('/guides/missing');
    expect(screen.getByText('Guide not found.')).toBeInTheDocument();
  });

  it("renders the matched guide's markdown content", () => {
    window.__DOCFY_GUIDES__ = [
      { slug: 'getting-started', title: 'Getting Started', content: '# Getting Started\n\nSome **bold** text.' },
    ];
    renderAt('/guides/getting-started');

    expect(screen.getByRole('heading', { level: 1, name: 'Getting Started' })).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders a GFM table', () => {
    window.__DOCFY_GUIDES__ = [
      {
        slug: 'table-guide',
        title: 'Table Guide',
        content: '| A | B |\n| - | - |\n| 1 | 2 |',
      },
    ];
    renderAt('/guides/table-guide');

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders a fenced code block via CodeBlock, not a bare <pre>', () => {
    window.__DOCFY_GUIDES__ = [{ slug: 'code-guide', title: 'Code Guide', content: '```ts\nconst x = 1;\n```' }];
    renderAt('/guides/code-guide');

    expect(screen.getByText('const')).toBeInTheDocument();
  });

  it('renders inline code as a simple <code> element', () => {
    window.__DOCFY_GUIDES__ = [{ slug: 'inline-guide', title: 'Inline', content: 'Use `npm install` to set up.' }];
    renderAt('/guides/inline-guide');

    const code = screen.getByText('npm install');
    expect(code.tagName).toBe('CODE');
  });
});
