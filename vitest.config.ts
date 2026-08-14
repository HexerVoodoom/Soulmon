import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

// FRONTEIRA: este arquivo é um config INDEPENDENTE do `vite.config.ts`. Os
// aliases (`figma:asset/*`, `@/*`, os pacotes com versão no nome) vivem só lá,
// então qualquer teste que importasse um componente com `figma:asset` morria em
// "Failed to resolve import" — que é uma das razões mecânicas de nunca ter
// existido teste de componente aqui. Em vez de copiar a tabela (footgun 9,
// "regra copiada diverge em silêncio"), reusamos a do build.
const alias = (viteConfig as { resolve?: { alias?: Record<string, string> } }).resolve?.alias ?? {};

export default defineConfig({
  resolve: { alias },
  test: {
    // Padrão continua `node`: os testes de regra pura não pagam o custo do DOM.
    // Os testes de RENDER pedem jsdom por arquivo, com o docblock
    // `// @vitest-environment jsdom` na primeira linha (ver src/test/renderEnv.tsx).
    environment: 'node',
    // `localStorage` do jsdom só existe em origem NÃO-opaca. Sem esta URL o
    // `about:blank` deixa `window.localStorage.getItem` como `undefined` e todo
    // componente que lê o storage cru quebra no teste (medido em
    // `CompanionHUD.tsx:228`). Só afeta arquivos com o docblock jsdom.
    environmentOptions: { jsdom: { url: 'http://localhost:3000/' } },
    include: [
      'src/**/*.test.ts', 'src/**/*.test.tsx', 'functions/**/*.test.js', 'workers/**/*.test.js',
      // O renderer do desktop tem cópias de regras do app (derivação do
      // saveId, HP por nível). Divergir delas quebra em SILÊNCIO — o overlay
      // lê um save que não existe e mostra um bicho genérico, sem erro.
      'desktop/renderer/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // `functions/**` é o código de DINHEIRO e de save. Ficava fora do
      // medidor, então `save.js` chegou a produção sem um único teste e com
      // dois defeitos dentro, sem que nenhum número mostrasse o buraco.
      // `workers/**` entra pelo mesmo motivo (push/VAPID).
      include: ['src/**/*.ts', 'src/**/*.tsx', 'functions/**/*.js', 'workers/**/*.js'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'functions/**/*.test.js', 'workers/**/*.test.js',
        'src/components/ui/**',
        'src/main.tsx',
        // Infra de teste (ambiente de render), não código de produto.
        'src/test/**',
      ],
    },
  },
});
