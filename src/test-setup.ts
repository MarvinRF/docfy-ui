import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver or scrollIntoView — cmdk (used by
// the search command palette) relies on both to manage its selected item.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
