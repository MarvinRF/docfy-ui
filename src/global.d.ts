declare global {
  interface Window {
    /** Mount prefix injected by DocfyUiModule.setup() when serving this app from a non-root path. */
    __DOCFY_BASE_PATH__?: string;
    /** List of specs injected by DocfyUiModule.setup({ specs }) — powers the spec switcher. */
    __DOCFY_SPECS__?: { name: string; url: string }[];
    /** Same-origin "Try it out" proxy path injected by DocfyUiModule.setup({ openApiDocument })
     * — when present, executeRequest() posts through it instead of fetching the target directly. */
    __DOCFY_PROXY_PATH__?: string;
    /** Narrative markdown guides injected by DocfyUiModule.setup({ guides }) — rendered at
     * `/guides/:slug`, listed in the sidebar above the endpoint tag tree. */
    __DOCFY_GUIDES__?: { slug: string; title: string; content: string }[];
  }
}

export {};
