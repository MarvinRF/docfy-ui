declare global {
  interface Window {
    /** Mount prefix injected by DocfyUiModule.setup() when serving this app from a non-root path. */
    __DOCFY_BASE_PATH__?: string;
    /** List of specs injected by DocfyUiModule.setup({ specs }) — powers the spec switcher. */
    __DOCFY_SPECS__?: { name: string; url: string }[];
  }
}

export {};
