/**
 * Tipos de `metricsReport.mjs`.
 *
 * O módulo é `.mjs` porque é ferramenta de linha de comando: roda com `node`
 * direto, sem passar por build nenhum — e essa é a razão de ele existir antes
 * da chave (WP0.1/D1). O `.d.ts` ao lado é o que deixa o teste em TypeScript
 * importá-lo sem `any` implícito.
 */
export declare const MIN_DIAS_CONVERSAO: number;

export declare function medianaDeHistograma(
  balde: Record<string | number, number> | null | undefined,
): number | null;

export declare function diasDaJanela(from?: string, to?: string): number;

export interface Razao { valor: number; num: number; den: number }
export declare function razao(numerador: number, denominador: number): Razao | null;
export declare function linhaDeRazao(rotulo: string, r: Razao | null): string;

export declare function barras(
  balde: Record<string | number, number> | null | undefined,
  opts?: { largura?: number },
): string[];

export declare const FAIXA_ESFORCO: string[];
export declare function histogramaEsforco(totais: Record<string, number>): Record<string, number>;

export declare function histogramaGoalDays(
  totais: Record<string, number>,
  prefixo?: string,
): Record<string, number>;

export interface MetricsPayload {
  ok?: boolean;
  from?: string;
  to?: string;
  days?: Record<string, Record<string, number>>;
  totals?: Record<string, number>;
  notes?: { cohort?: string; unreadable?: string[] };
}
export declare function histogramaActiveDays(
  totais: Record<string, number>,
  prefixo?: string,
): Record<string, number>;
export declare function renderTudo(totais: Record<string, number> | null | undefined): string[];
export declare function renderRelatorio(payload: MetricsPayload, opts?: { full?: boolean }): string[];
