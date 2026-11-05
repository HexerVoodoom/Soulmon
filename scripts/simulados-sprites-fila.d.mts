// Tipos de `scripts/simulados-sprites-fila.mjs` (consumidos por `functions/api/_simulados.test.js` e `simulados-prompts.ts`).
export interface ItemFila { id: string; formId: string; refDe: string | null; element: string; line: string; prompt: string | null; sha: string | null; arquivo: string }
export type MapaDePrompts = Record<string, Record<string, { prompt: string; fallback: string }>>;
export declare const SAIDA_PADRAO: string;
export declare const PREVIA: readonly string[];
export declare const CUSTO_POR_IMAGEM: number;
export declare function shaDe(texto: string | Uint8Array): string;
export declare function formasDaLinha(line: string): string[];
export declare function cadeiaAte(line: string, forma: string): string[];
export declare function chaveDoCache(item: ItemFila): string;
export declare function planejar(only?: string[] | null, dia?: string, prompts?: MapaDePrompts | null): ItemFila[];
export declare function parseArgs(argv: string[]): { only: string[] | null; previa: boolean; dia: string; out: string; lote: string | null; instalar: string | null };
export declare function pendentes(plano: ItemFila[], manifesto: Record<string, unknown>, existe?: (it: ItemFila) => boolean): ItemFila[];
export declare function hashRepetido(manifesto: Record<string, { hash: string }>): [string, string] | null;
export declare function pngTemAlfa(b: Uint8Array): boolean;
