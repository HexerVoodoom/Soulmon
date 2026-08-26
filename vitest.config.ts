import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';
// O NÚMERO do orçamento mora em `vitest.budget.mjs` porque tem dois leitores:
// este arquivo (que o aplica) e `scripts/orcamento-de-tempo.mjs` (que afere
// quem está perto dele). Ver o cabeçalho de lá.
import { TEST_TIMEOUT_MS } from './vitest.budget.mjs';

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
    // PISO DE ROBUSTEZ, não conserto de lentidão.
    //
    // Até 26/08/2026 a suíte inteira vivia no default de 5s do Vitest, sem uma
    // única exceção declarada. O flake medido em `sweeper/flake-assets-contract.md`
    // mostra o mesmo teste a 2599ms com 6 CPUs concorrentes (52% do orçamento) e
    // a 5005ms sob 8 (100% — timeout). O fator entre a carga normal e a que
    // estoura é pequeno demais: 5s não tem folga para CI compartilhada nem para
    // Windows frio.
    //
    // 15s dá ~3x sobre o pior caso PRÉ-conserto já observado. Não é licença para
    // teste lento: aquele caso foi consertado na origem (1242ms → 14ms) e o
    // documento do sweeper rejeita por escrito subir o timeout como solução.
    //
    // O valor não é escolhido no vácuo: o único teste que já declarava teto
    // próprio (`assets/assets.contract.test.ts`, o guard de vínculo do F-2)
    // escolheu 15s pelo mesmo raciocínio, medindo 514ms. Alinhar o piso global
    // a ele evita duas réguas para a mesma pergunta.
    //
    // ✅ DÍVIDA PAGA (26/08/2026). O passe existe: `npm run orcamento` roda a
    // suíte N vezes, ordena por PIOR caso e por INSTABILIDADE, e aplica a régua
    // de `vitest.budget.mjs` (atenção 10% / dívida 25% / crítico 50%). Baseline
    // medido em `squad-alpha-runs/soulmon-02/sweeper/orcamento-de-tempo.md`:
    // pior caso 1248 ms = 8,3% do orçamento, ZERO testes acima de 10%.
    //
    // O passe NÃO virou teste da suíte, e a razão é medida: com o pior caso em
    // 1248 ms e o fator de contenção de 4,4× medido no incidente de referência,
    // um guard de relógio ficaria vermelho a ~5,5 s numa máquina carregada sem
    // que nada tivesse piorado no código. Seria trocar um flake por outro.
    testTimeout: TEST_TIMEOUT_MS,
    include: [
      'src/**/*.test.ts', 'src/**/*.test.tsx', 'functions/**/*.test.js', 'workers/**/*.test.js',
      // O renderer do desktop tem cópias de regras do app (derivação do
      // saveId, HP por nível). Divergir delas quebra em SILÊNCIO — o overlay
      // lê um save que não existe e mostra um bicho genérico, sem erro.
      'desktop/renderer/**/*.test.ts',
      // `public/sw.js` nao e `src/**` nem `functions/**`, e ficou sem lugar —
      // e sem teste — ate 26/08/2026. Ele e caminho de EXECUCAO (o que entra
      // no cache e servido da nossa origem para sempre), entao ganhou raiz
      // propria: `tests/` para o codigo que nao mora em nenhum dos bundles.
      'tests/**/*.test.ts',
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
