declare global {
  interface Window {
    /** Mount prefix injected by DocfyUiModule.setup() when serving this app from a non-root path. */
    __DOCFY_BASE_PATH__?: string;
  }
}

export {};
