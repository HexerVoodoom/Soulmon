/**
 * A CHAVE DO FOCO (beta3 F1): concluir o "Prepare to Focus" (o prédio de preparação da sessão) dá uma chave que libera a Focus Workshop.
 * A chave mora no SAVE (`focusKeyDay`, o dia do jogador em que foi ganha) e vale naquele dia do jogador — sem acumular nem gastar.
 * Puro: sem React, sem storage, `now` por parâmetro. Campo novo = leitura tolerante (`sanitizeFocusKeyDay`).
 */
import { anchorOffsetMs, deviceOffsetMs, playerDayIso, type PlayerDayAnchor } from './playerDay';

export interface FocusKeyState { focusKeyDay?: string; playerDayTz?: PlayerDayAnchor }

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lixo → `undefined` (sem chave). */
export function sanitizeFocusKeyDay(raw: unknown): string | undefined {
  return typeof raw === 'string' && ISO_DAY.test(raw) ? raw : undefined;
}

/** A chave vale AGORA? (foi ganha no dia do jogador de agora; relógio que volta não a revalida). */
export function hasFocusKey(state: FocusKeyState, nowMs: number): boolean {
  const k = sanitizeFocusKeyDay(state.focusKeyDay);
  return !!k && k === playerDayIso(new Date(nowMs), state.playerDayTz);
}

/** Dá a chave do dia. Idempotente: já tendo a de hoje, devolve a MESMA referência. */
export function grantFocusKey<T extends FocusKeyState>(prev: T, nowMs: number): T {
  if (hasFocusKey(prev, nowMs)) return prev;
  return { ...prev, focusKeyDay: playerDayIso(new Date(nowMs), prev.playerDayTz) };
}

/**
 * A CHAVE DA DUNGEON (dono, 05/11/2026, §239; validade 48 h e 1 uso por dia em §299): concluir uma sessão na Oficina dá a chave. Não acumula (uma só; a nova a renova).
 * Quem já tinha incursão andando hoje quando a regra chegou (`step > 0`) não é trancado no meio.
 */
export interface DungeonKeyState { dungeonKeyDay?: string; playerDayTz?: PlayerDayAnchor; rogueDungeon?: { day: string; step: number } }
/**
 * §299 (dono, 11/11/2026): a chave vale 48 h (o dia do jogador em que foi ganha + o seguinte) e dá UMA entrada por dia
 * (a incursão é uma por dia do jogador, `runForDay`; o dia vem da âncora do jogador, nunca do relógio cru do aparelho).
 * Chave de dia FUTURO (relógio que volta) não vale. Save antigo (`dungeonKeyDay` de ontem) ganha a janela nova sem migração.
 */
export const DUNGEON_KEY_VALID_HOURS = 48;
const DUNGEON_KEY_VALID_DAYS = DUNGEON_KEY_VALID_HOURS / 24;
const diasEntre = (a: string, b: string): number => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000);
/** Último dia do jogador (AAAA-MM-DD) em que a chave ganha em `keyDay` ainda vale (o dia da conquista + 1). */
export function dungeonKeyLastDay(keyDay: string): string {
  const d = new Date(Date.UTC(+keyDay.slice(0, 4), +keyDay.slice(5, 7) - 1, +keyDay.slice(8, 10) + DUNGEON_KEY_VALID_DAYS - 1));
  return d.toISOString().slice(0, 10);
}
export function hasDungeonKey(state: DungeonKeyState, nowMs: number): boolean {
  const hoje = playerDayIso(new Date(nowMs), state.playerDayTz);
  const k = sanitizeFocusKeyDay(state.dungeonKeyDay);
  const idade = k ? diasEntre(k, hoje) : -1;
  return (idade >= 0 && idade < DUNGEON_KEY_VALID_DAYS) || (state.rogueDungeon?.day === hoje && state.rogueDungeon.step > 0);
}
/** A chave existe no save mas já passou das 48 h (para a UI dizer "expirou"). */
export function dungeonKeyExpired(state: DungeonKeyState, nowMs: number): boolean {
  const k = sanitizeFocusKeyDay(state.dungeonKeyDay);
  return !!k && diasEntre(k, playerDayIso(new Date(nowMs), state.playerDayTz)) >= DUNGEON_KEY_VALID_DAYS;
}
/**
 * Instante (ms) em que a chave do Calabouço deixa de valer: a meia-noite do jogador DEPOIS do último dia válido (`dungeonKeyLastDay`).
 * Sem chave valendo agora → `null`. A trava legada (incursão de hoje andando, sem chave no save) vale até a virada de hoje.
 * É o contador do mapa da Exploração (13/11/2026, dono): a chave não regenera, ela EXPIRA; o relógio mostra quanto falta.
 */
export function dungeonKeyExpiresAt(state: DungeonKeyState, nowMs: number): number | null {
  if (!hasDungeonKey(state, nowMs)) return null;
  const now = new Date(nowMs);
  const hoje = playerDayIso(now, state.playerDayTz);
  const k = sanitizeFocusKeyDay(state.dungeonKeyDay);
  const ultimoDaChave = k && diasEntre(k, hoje) >= 0 ? dungeonKeyLastDay(k) : hoje;
  const ultimo = ultimoDaChave < hoje ? hoje : ultimoDaChave;
  const off = anchorOffsetMs(state.playerDayTz, now) ?? deviceOffsetMs(now);
  return Date.UTC(+ultimo.slice(0, 4), +ultimo.slice(5, 7) - 1, +ultimo.slice(8, 10) + 1) - off;
}

/** Idempotente: já tendo a de hoje, devolve a MESMA referência. */
export function grantDungeonKey<T extends DungeonKeyState>(prev: T, nowMs: number): T {
  const hoje = playerDayIso(new Date(nowMs), prev.playerDayTz);
  return prev.dungeonKeyDay === hoje ? prev : { ...prev, dungeonKeyDay: hoje };
}

/**
 * COMPAT pré-beta3: quem já tinha uma sessão de foco PRONTA hoje (planejada na Oficina, antes de existir o "Prepare to Focus") não tem
 * `focusKeyDay` no save e ficaria trancado. Uma sessão `ready` do dia do jogador vale como a chave de hoje.
 * `session` = a sessão guardada no aparelho (`normalizeSession`); sem ela, só vale a chave do save.
 */
export function hasFocusKeyOrLegacy(state: FocusKeyState, nowMs: number, session: { status?: string; day?: string } | null | undefined): boolean {
  if (hasFocusKey(state, nowMs)) return true;
  return !!session && session.status === 'ready' && session.day === playerDayIso(new Date(nowMs), state.playerDayTz);
}

/**
 * O que `hasFocusKeyOrLegacy` lê da sessão guardada (`status` + `day`), com o MESMO portão de validade de `normalizeSession`
 * (`focoSessao.ts`: id/name/day string, status ready|completed, modo p25|p50) — sem importar a Oficina (~7 KB) para o chunk de entrada.
 * `focusKey.legacyStamp.test.ts` prova a equivalência com `normalizeSession`.
 */
export function focusSessionStamp(raw: unknown): { status: 'ready' | 'completed'; day: string } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.day !== 'string' || (r.status !== 'ready' && r.status !== 'completed')) return null;
  if (r.mode !== 'p25' && r.mode !== 'p50') return null;
  return { status: r.status, day: r.day.slice(0, 10) };
}
