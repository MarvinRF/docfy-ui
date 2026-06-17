import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Default to node — swagger-parser's resolver detects a `window` global
    // and switches to HTTP fetch for relative paths instead of fs.readFile,
    // which breaks Document Model / parser-spike tests under jsdom.
    // React component/hook/store tests opt into jsdom via a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
