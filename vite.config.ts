
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { readFileSync } from 'fs';

// VERSÃO ÚNICA (design-critic B1, 21/09/2026): a tela mostrava "1.0.2", o
// `package.json` dizia 0.1.0 e o `build.gradle` 1.1.4. Fonte única = o
// `version` do `package.json`; a UI lê `__APP_VERSION__` (FeedbackLink.tsx) e
// `src/deploy/versaoUnica.contract.test.ts` prende o gradle ao mesmo número.
const APP_VERSION: string = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).version;

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // O motor do Class-System entra pelo ARTEFATO COMPILADO commitado em
      // `vendor/class-system/`, e NÃO por dependência npm de git (ADR-002 §1).
      // A resolução antiga (`git+ssh://…/Class-System.git` no package-lock) só
      // funcionava porque o repositório é público; no dia em que ele virar
      // privado o `npm ci` do Cloudflare Pages falha e a `main` para de
      // publicar. Com o alias, o build não busca rede nem credencial nenhuma.
      // Atualizar o vendor: `npm run vendor:class-system` (clone irmão).
      'class-system': path.resolve(__dirname, './vendor/class-system/index.js'),
      // ⚰️ 21/09/2026 (QA GERAL, decisão #33): saíram daqui 38 aliases
      // `pkg@versão → pkg` (26 `@radix-ui/*`, `vaul`, `recharts`, `cmdk`,
      // `class-variance-authority`, `embla-carousel-react`, `input-otp`,
      // `next-themes`, `react-day-picker`, `react-hook-form`,
      // `react-resizable-panels`, `@jsr/supabase__supabase-js`) junto com os
      // pacotes — eram o scaffold shadcn do Figma, sem um único import. Quem
      // impede a volta silenciosa é `src/deploy/depsVivas.contract.test.ts`.
      'sonner@2.0.3': 'sonner',
      'lucide-react@0.487.0': 'lucide-react',
      'figma:asset/90d2794255a0abd49ab9e2ca8c9f1c54b45d7cd0.png': path.resolve(__dirname, './src/assets/90d2794255a0abd49ab9e2ca8c9f1c54b45d7cd0.png'),
      'figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png': path.resolve(__dirname, './src/assets/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    // Keep sprites as real files (never inlined base64): they stay out of the
    // JS parse cost and the service worker can serve their WebP variants.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // Long-term-cacheable vendor chunk — app changes don't invalidate it.
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});