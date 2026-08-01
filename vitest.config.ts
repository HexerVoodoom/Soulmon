import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts', 'src/**/*.test.tsx', 'functions/**/*.test.js',
      // O renderer do desktop tem cópias de regras do app (derivação do
      // saveId, HP por nível). Divergir delas quebra em SILÊNCIO — o overlay
      // lê um save que não existe e mostra um bicho genérico, sem erro.
      'desktop/renderer/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/components/ui/**',
        'src/main.tsx',
      ],
    },
  },
});
