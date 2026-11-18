export interface HostConfig {
  basePath?: string;
  specs?: { name: string; url: string }[];
  proxyPath?: string;
  guides?: { slug: string; title: string; content: string }[];
  /** Security misconfigurations the host detected (sent only outside production). */
  securityNotices?: string[];
}

export const HOST_CONFIG_ELEMENT_ID = 'docfy-config';

/**
 * Config the host server (`DocfyUiModule.setup()`) injects into index.html. nestjs-docfy >=0.19
 * sends it as a `<script type="application/json" id="docfy-config">` data block: never executed,
 * so it works under a `script-src 'self'` CSP. Older hosts set `window.__DOCFY_*__` globals from
 * inline scripts; those are still read as a fallback so a docfy-ui upgrade never needs a
 * matching nestjs-docfy upgrade.
 */
export function getHostConfig(): HostConfig {
  if (typeof window === 'undefined') return {};

  let fromJson: HostConfig = {};
  const text = document.getElementById(HOST_CONFIG_ELEMENT_ID)?.textContent;
  if (text) {
    try {
      fromJson = JSON.parse(text) as HostConfig;
    } catch {
      // Malformed block — fall through to the legacy globals rather than breaking the page.
    }
  }

  return {
    basePath: fromJson.basePath ?? window.__DOCFY_BASE_PATH__,
    specs: fromJson.specs ?? window.__DOCFY_SPECS__,
    proxyPath: fromJson.proxyPath ?? window.__DOCFY_PROXY_PATH__,
    guides: fromJson.guides ?? window.__DOCFY_GUIDES__,
    securityNotices: fromJson.securityNotices,
  };
}
