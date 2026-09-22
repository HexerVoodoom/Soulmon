/**
 * Tipos de `convert-to-webp.mjs` — só `converter`, que é o que
 * `tests/convertToWebp.test.ts` importa. Mesmo motivo do `metrics-report.d.mts`.
 */
export interface ResultadoConversao {
  ok: boolean;
  motivo: 'sem-dist' | 'sem-png' | 'sobras' | 'falhas' | null;
  convertidos: string[];
  falhas: string[];
  sobras: string[];
  referencias: number;
  arquivosReescritos: number;
  savedBytes: number;
  total: number;
}
export declare function converter(
  distDir?: string,
  opts?: {
    log?: (s: string) => void;
    error?: (s: string) => void;
    converterUm?: (inputPath: string, outputPath: string) => Promise<void>;
  },
): Promise<ResultadoConversao>;
