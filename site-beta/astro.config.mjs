import { defineConfig } from 'astro/config';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// O site mora em https://soulmon.pages.dev/beta. Astro grava em dist/beta (outDir) e, no fim do build,
// este plugin leva para a RAIZ de dist o que o Pages so le dali: _headers, _routes.json, _redirects e 404.html.
const raizDist = fileURLToPath(new URL('./dist/', import.meta.url));
const levarParaRaiz = {
  name: 'levar-para-raiz',
  hooks: {
    'astro:build:done': () => {
      mkdirSync(raizDist, { recursive: true });
      for (const f of ['_headers', '_routes.json', '_redirects', 'robots.txt', 'sitemap.xml']) copyFileSync(fileURLToPath(new URL(`./edge/${f}`, import.meta.url)), raizDist + f);
      if (existsSync(raizDist + 'beta/404.html')) copyFileSync(raizDist + 'beta/404.html', raizDist + '404.html');
    },
  },
};

// Sem JS/CSS inline: a CSP de producao nao precisa de hash nem de 'unsafe-inline'.
export default defineConfig({
  site: 'https://soulmon.pages.dev',
  base: '/beta',
  outDir: 'dist/beta',
  output: 'static',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'never', format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
  integrations: [levarParaRaiz],
});
