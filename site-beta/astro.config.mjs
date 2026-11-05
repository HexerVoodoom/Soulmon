import { defineConfig } from 'astro/config';

// Sem JS/CSS inline: a CSP de producao nao precisa de hash nem de 'unsafe-inline'.
export default defineConfig({
  site: 'https://soulmon-beta.pages.dev',
  output: 'static',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'never', format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
});
