/**
 * O DESAFIO DO DIA DA FEIRA (dono, 04/11/2026): todo dia o jogador MANDA o Soulmon investigar; ele volta com um
 * desafio (o inimigo) que tem de ser vencido NO MESMO DIA DO JOGADOR. Voltou noutro dia sem ter lutado → o inimigo
 * "apareceu, mas escapou", e a sala volta a oferecer "Mandar investigar".
 *
 * Registro SÓ DO APARELHO (`STORAGE_KEYS.FEIRA_DESAFIO`), nunca no save: saves antigos carregam iguais, e perder a
 * chave só faz a sala pedir uma nova investigação. A trava de verdade do ataque (1/dia) segue sendo do servidor.
 */
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

export interface FeiraDesafio {
  /** Dia do jogador (`playerDayKey`) em que o Soulmon voltou com o desafio. */
  day: string;
  /** O mistério do clã (`FeiraEvento.k`). */
  k: number;
  /** Já lutou/cumpriu hoje. */
  done: boolean;
}

export type FeiraDesafioStatus = 'none' | 'open' | 'done' | 'escaped';

export function sanitizeFeiraDesafio(raw: unknown): FeiraDesafio | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !r.day || r.day.length > 40) return null;
  const k = typeof r.k === 'number' && Number.isFinite(r.k) ? Math.max(0, Math.floor(r.k)) : 0;
  return { day: r.day, k, done: r.done === true };
}

/** PURA: o estado do desafio no dia `today`. Outro dia sem ter lutado = escapou. */
export function feiraDesafioStatus(d: FeiraDesafio | null, today: string): FeiraDesafioStatus {
  if (!d) return 'none';
  if (d.done) return d.day === today ? 'done' : 'none';
  return d.day === today ? 'open' : 'escaped';
}

export const readFeiraDesafio = (): FeiraDesafio | null => sanitizeFeiraDesafio(readJson<unknown>(STORAGE_KEYS.FEIRA_DESAFIO, null));

/** A volta da Missão trouxe um desafio hoje. */
export function recordFeiraDesafio(day: string, k: number): void {
  writeJson(STORAGE_KEYS.FEIRA_DESAFIO, { day, k, done: false }, { silent: true });
}

/** Lutou (ou cumpriu o desafio) hoje: não escapa mais. */
export function markFeiraDesafioDone(): void {
  const d = readFeiraDesafio();
  if (d && !d.done) writeJson(STORAGE_KEYS.FEIRA_DESAFIO, { ...d, done: true }, { silent: true });
}
