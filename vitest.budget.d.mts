// Tipos de `vitest.budget.mjs`.
//
// O arquivo de origem é `.mjs` (ver o cabeçalho dele: precisa ser consumível
// pelo `vitest.config.ts` bundlado E por um script Node cru, sem passo de
// compilação). Só que ele também é lido por `src/test/renderEnv.tsx`, que
// PASSA pelo `tsc --noEmit` do gate — e sem declaração isso vira TS7016, o
// mesmo erro que manteve o gate do desktop vermelho por meses
// (`desktop/tsconfig.json`). Declarar é mais barato que descobrir.

export declare const TEST_TIMEOUT_MS: number;

export declare const LIMIARES: Readonly<{
  atencao: number;
  divida: number;
  critico: number;
}>;
