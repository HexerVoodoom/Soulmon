import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

// Config SEPARADO só para `npm run oraculo:auditoria` — nunca usado por
// `npx vitest run` (que resolve `vitest.config.ts`, sem `--config`). Reusa
// aliases/timeout do config base (mesma fronteira que ele já documenta:
// não copiar tabela, importar) e troca só o `include` para apontar para o
// script de auditoria, que fica fora do include default de propósito
// (`docs/oraculo-plano/rodada2-regua.md` §1).
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['scripts/oraculo-auditoria.test.ts'],
  },
});
