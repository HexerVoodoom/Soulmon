/**
 * O RESULTADO DA VOLTA DA MISSÃO, guardado até o jogador vê-lo (bug do dono, 12/11/2026: "mandei investigar, ele voltou, abri a
 * Feira e apareceu INVESTIGAR de novo, em vez do que ele achou").
 *
 * Antes, o que a volta trazia (mistério, Feira de verdade, achado) só existia como interstitial/toast de uma vez só: dispensado
 * ou nunca apresentado, a sala não tinha como mostrá-lo e voltava a oferecer "Mandar investigar". Agora a volta grava aqui
 * `{day, kind, ...}`; a sala mostra "Ver o que ele achou" até `seen`, e só depois libera investigar de novo (a trava de 1 por
 * dia continua do servidor, e o cooldown do dia do jogador continua o mesmo: `day` é o dia da volta).
 *
 * Registro SÓ DO APARELHO (como `feiraDesafio.ts`): perder a chave só faz a sala voltar ao comportamento de antes.
 */
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { sanitizeFeiraEvento, sanitizeAchado, type FeiraEvento, type Achado } from './feira';
import { sanitizeFeiraLoja, type FeiraLoja } from './feiraLoja';

export type FeiraVolta =
  | { day: string; seen: boolean; kind: 'evento'; evento: FeiraEvento }
  | { day: string; seen: boolean; kind: 'loja'; loja: FeiraLoja }
  | { day: string; seen: boolean; kind: 'achado'; achado: Achado }
  | { day: string; seen: boolean; kind: 'nada' };

export function sanitizeFeiraVolta(raw: unknown): FeiraVolta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !r.day || r.day.length > 40) return null; // dia do jogador (`playerDayKey`), no formato dele
  const base = { day: r.day, seen: r.seen === true };
  if (r.kind === 'evento') { const evento = sanitizeFeiraEvento(r.evento); return evento ? { ...base, kind: 'evento', evento } : null; }
  if (r.kind === 'loja') { const loja = sanitizeFeiraLoja(r.loja); return loja ? { ...base, kind: 'loja', loja } : null; }
  if (r.kind === 'achado') { const achado = sanitizeAchado(r.achado); return achado ? { ...base, kind: 'achado', achado } : null; }
  return r.kind === 'nada' ? { ...base, kind: 'nada' } : null;
}

export const readFeiraVolta = (): FeiraVolta | null => sanitizeFeiraVolta(readJson<unknown>(STORAGE_KEYS.FEIRA_VOLTA, null));

/** A volta de `day` foi registrada (ela já conta como "voltou hoje", mesmo que a releitura da vista venha velha). */
export const feiraVoltaDoDia = (v: FeiraVolta | null, today: string): FeiraVolta | null => (v && v.day === today ? v : null);

/** Há algo que o jogador ainda não viu, trazido HOJE? */
export const feiraVoltaPendente = (v: FeiraVolta | null, today: string): FeiraVolta | null => {
  const d = feiraVoltaDoDia(v, today);
  return d && !d.seen && d.kind !== 'nada' ? d : null;
};

/** Grava o que a volta trouxe. `seen` já nasce true quando não há nada para mostrar. */
type SemSeen<T> = T extends unknown ? Omit<T, 'seen'> & { seen?: boolean } : never;
export function recordFeiraVolta(v: SemSeen<FeiraVolta>): void {
  writeJson(STORAGE_KEYS.FEIRA_VOLTA, { ...v, seen: v.seen ?? v.kind === 'nada' }, { silent: true });
}

/** O jogador viu (fechou o interstitial, ou abriu pela sala): a sala libera investigar de novo. */
export function markFeiraVoltaSeen(): void {
  const v = readFeiraVolta();
  if (v && !v.seen) writeJson(STORAGE_KEYS.FEIRA_VOLTA, { ...v, seen: true }, { silent: true });
}
