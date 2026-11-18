// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getHostConfig, HOST_CONFIG_ELEMENT_ID } from './host-config';

function setJsonBlock(text: string) {
  const el = document.createElement('script');
  el.type = 'application/json';
  el.id = HOST_CONFIG_ELEMENT_ID;
  el.textContent = text;
  document.head.appendChild(el);
}

afterEach(() => {
  document.getElementById(HOST_CONFIG_ELEMENT_ID)?.remove();
  delete window.__DOCFY_BASE_PATH__;
  delete window.__DOCFY_SPECS__;
  delete window.__DOCFY_PROXY_PATH__;
  delete window.__DOCFY_GUIDES__;
});

describe('getHostConfig()', () => {
  it('reads the JSON data block injected by the host', () => {
    setJsonBlock(JSON.stringify({ basePath: '/docs/', proxyPath: '/docs/__docfy_proxy', securityNotices: ['fix me'] }));
    expect(getHostConfig()).toMatchObject({
      basePath: '/docs/',
      proxyPath: '/docs/__docfy_proxy',
      securityNotices: ['fix me'],
    });
  });

  it('falls back to the legacy window globals set by older hosts', () => {
    window.__DOCFY_BASE_PATH__ = '/legacy/';
    window.__DOCFY_SPECS__ = [{ name: 'a', url: '/a' }];
    expect(getHostConfig()).toMatchObject({ basePath: '/legacy/', specs: [{ name: 'a', url: '/a' }] });
  });

  it('prefers the JSON block over the legacy globals', () => {
    window.__DOCFY_BASE_PATH__ = '/legacy/';
    setJsonBlock(JSON.stringify({ basePath: '/docs/' }));
    expect(getHostConfig().basePath).toBe('/docs/');
  });

  it('ignores a malformed JSON block instead of throwing', () => {
    window.__DOCFY_BASE_PATH__ = '/legacy/';
    setJsonBlock('{not json');
    expect(getHostConfig().basePath).toBe('/legacy/');
  });
});
