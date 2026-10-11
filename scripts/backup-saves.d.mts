// Tipos de `scripts/backup-saves.mjs` (consumidos por `tests/backupSaves.test.ts`).
export interface BackupOpts { binding: string; out: string; prefix: string; dryRun: boolean }
export interface ChaveKv { name: string; expiration?: number }
export interface LinhaRestauracao { key: string; value: string; expiration?: number }
export const OUT_PADRAO: string;
export const BINDING_PADRAO: string;
export const LOTE: number;
export function parseArgs(argv: string[]): BackupOpts;
export function lotes<T>(arr: T[], n?: number): T[][];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extrairJson(stdout: unknown): any;
export function normalizarLista(json: unknown): ChaveKv[];
export function normalizarBulk(json: unknown): Record<string, string>;
export function montarRestauracao(chaves: ChaveKv[], valores: Record<string, string>): LinhaRestauracao[];
export function nomeArquivo(binding: string, agora?: Date): string;
export function backup(
  opts: BackupOpts,
  deps?: { wrangler?: (args: string[]) => string; agora?: Date; log?: (s: string) => void },
): Promise<{ arquivo: string | null; total: number; gravadas: number }>;
