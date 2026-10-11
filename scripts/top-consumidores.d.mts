// Tipos de `scripts/top-consumidores.mjs` (consumidos por `tests/topConsumidores.test.ts`).
export declare const APP_URL_PADRAO: string;
export declare function parseArgs(argv: string[], env?: Record<string, string | undefined>): { url: string; day: string; json: boolean };
export declare function renderTabela(res: { day: string; top?: Record<string, Array<{ saveIdPrefix: string; n: number; acima80: boolean }>> }): string;
