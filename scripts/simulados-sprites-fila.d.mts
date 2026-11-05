// Tipos de `scripts/simulados-sprites-fila.mjs` (consumidos por `functions/api/_simulados.test.js`).
export interface ItemFila { id: string; formId: string; element: string; line: string; prompt: string; sha: string; arquivo: string }
export declare const SAIDA_PADRAO: string;
export declare const GEN_PADRAO: string;
export declare const PREVIA: readonly string[];
export declare const CUSTO_POR_IMAGEM: number;
export declare function shaDe(texto: string | Uint8Array): string;
export declare function promptDe(p: { petName: string; element: string; line: string }, forma: string): string;
export declare function chaveDoCache(item: ItemFila): string;
export declare function planejar(only?: string[] | null, dia?: string): ItemFila[];
export declare function parseArgs(argv: string[]): { run: boolean; only: string[] | null; previa: boolean; dia: string; out: string; gen: string };
export declare function pendentes(plano: ItemFila[], manifesto: Record<string, unknown>, existe?: (it: ItemFila) => boolean): ItemFila[];
export declare function hashRepetido(manifesto: Record<string, { hash: string }>): [string, string] | null;
export declare function pngTemAlfa(b: Uint8Array): boolean;
