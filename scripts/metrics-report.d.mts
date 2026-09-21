/**
 * Tipos de `metrics-report.mjs` — só a metade PURA (a tabela e a janela), que
 * é o que `tests/metricsReportFunil.test.ts` importa. Mesmo motivo do
 * `tools/metricsReport.d.mts`: o script é `.mjs` para rodar com `node` direto,
 * e o `.d.mts` ao lado é o que deixa o teste em TypeScript importá-lo sem
 * `any` implícito.
 */
export declare const APP_URL_PADRAO: string;
export declare const DIAS_PADRAO: number;
export declare const LINHAS_DO_FUNIL: ReadonlyArray<readonly [string, string]>;

export declare function tabelaDoFunil(payload: unknown): string[];
export declare function diaUtc(diasAtras?: number, agora?: number): string;
export declare function janela(to?: string, dias?: number): { from: string; to: string };
