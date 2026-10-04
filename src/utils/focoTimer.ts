/**
 * OFICINA DO FOCO — o timer e o registro local dos "foquei" (04/10/2026).
 *
 * Regras (`docs/PLANO-OFICINA-FOCO.md` §5):
 *  · O tempo é um TIMESTAMP (`endAt`), nunca um contador que soma ticks: a tela só relê o
 *    relógio. Aba em segundo plano, folha fechada ou app suspenso não desviam a conta.
 *  · Tudo mora SÓ no aparelho (`STORAGE_KEYS.FOCO_*`), fora do save em nuvem.
 *  · Nada aqui paga Bits, XP, Emblema ou Vínculo, e não há total público, sequência ou placar:
 *    só "hoje: N focos", para a própria pessoa, e dias antigos somem (`KEEP_DAYS`).
 *  · O aviso de fim usa a notificação local SÓ se a permissão já estava concedida (esta tela
 *    NUNCA a pede) e uma vibração curta. Sem permissão: o aviso é o da tela.
 */
import { readJson, writeJson, removeLocal, readLocal, writeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { showNotification } from './notifications';

export type FocoModeId = 'p25' | 'p50';
export type FocoPhase = 'focus' | 'break';

export interface FocoMode { focusMin: number; breakMin: number; longMin: number }
export const FOCO_MODES: Record<FocoModeId, FocoMode> = {
  p25: { focusMin: 25, breakMin: 5, longMin: 15 },
  p50: { focusMin: 50, breakMin: 10, longMin: 20 },
};
/** A pausa longa vem depois de cada 4 focos do dia no modo 25/5 (Cirillo). */
export const LONG_BREAK_EVERY = 4;
/** Quantos dias o registro guarda; o resto é descartado ao gravar. */
export const KEEP_DAYS = 14;

export interface FocoTimer {
  mode: FocoModeId;
  phase: FocoPhase;
  /** `running` conta contra `endAt`; `paused` guarda `leftMs`; `ended` já chegou a zero. */
  status: 'running' | 'paused' | 'ended';
  totalMs: number;
  endAt: number | null;
  leftMs: number | null;
}

const isMode = (v: unknown): v is FocoModeId => v === 'p25' || v === 'p50';
const MAX_MS = 60 * 60 * 1000;

/** Lixo no storage nunca derruba a folha: o que não for exatamente o formato vira "sem timer". */
export function normalizeTimer(raw: unknown): FocoTimer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isMode(r.mode) || (r.phase !== 'focus' && r.phase !== 'break')) return null;
  if (r.status !== 'running' && r.status !== 'paused' && r.status !== 'ended') return null;
  const total = Number(r.totalMs);
  if (!Number.isFinite(total) || total <= 0 || total > MAX_MS) return null;
  const base = { mode: r.mode, phase: r.phase, totalMs: Math.round(total) } as const;
  if (r.status === 'running') {
    const end = Number(r.endAt);
    if (!Number.isFinite(end) || end <= 0) return null;
    return { ...base, status: 'running', endAt: end, leftMs: null };
  }
  if (r.status === 'paused') {
    const left = Number(r.leftMs);
    if (!Number.isFinite(left) || left < 0 || left > total) return null;
    return { ...base, status: 'paused', endAt: null, leftMs: Math.round(left) };
  }
  return { ...base, status: 'ended', endAt: null, leftMs: 0 };
}

export const startPhase = (mode: FocoModeId, phase: FocoPhase, now: number, long = false): FocoTimer => {
  const m = FOCO_MODES[mode];
  const min = phase === 'focus' ? m.focusMin : long ? m.longMin : m.breakMin;
  const totalMs = min * 60_000;
  return { mode, phase, status: 'running', totalMs, endAt: now + totalMs, leftMs: null };
};

export const remainingMs = (t: FocoTimer, now: number): number => {
  if (t.status === 'ended') return 0;
  if (t.status === 'paused') return t.leftMs ?? 0;
  return Math.max(0, (t.endAt ?? now) - now);
};

/** Se o relógio passou do fim, devolve o timer como `ended`; senão o mesmo objeto. */
export const settle = (t: FocoTimer, now: number): FocoTimer =>
  t.status === 'running' && remainingMs(t, now) <= 0
    ? { ...t, status: 'ended', endAt: null, leftMs: 0 }
    : t;

export const pause = (t: FocoTimer, now: number): FocoTimer =>
  t.status !== 'running' ? t : { ...t, status: 'paused', endAt: null, leftMs: remainingMs(t, now) };

export const resume = (t: FocoTimer, now: number): FocoTimer =>
  t.status !== 'paused' ? t : { ...t, status: 'running', endAt: now + (t.leftMs ?? 0), leftMs: null };

/** "25:00" — minutos e segundos, arredondando PARA CIMA (0:00 só quando acabou). */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// ── Persistência ─────────────────────────────────────────────────────────────
export const loadTimer = (): FocoTimer | null => normalizeTimer(readJson<unknown>(STORAGE_KEYS.FOCO_TIMER, null));
export function saveTimer(t: FocoTimer | null): void {
  if (!t) removeLocal(STORAGE_KEYS.FOCO_TIMER, { silent: true });
  else writeJson(STORAGE_KEYS.FOCO_TIMER, t, { silent: true });
}

// ── Os "foquei" do dia ───────────────────────────────────────────────────────
export type FocoDays = Record<string, { n: number; min: number }>;
const isDayKey = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export function normalizeSessions(raw: unknown): FocoDays {
  const out: FocoDays = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const dias = Object.keys(raw as object).filter(isDayKey).sort().slice(-KEEP_DAYS);
  for (const d of dias) {
    const e = (raw as Record<string, unknown>)[d] as Record<string, unknown> | null;
    const n = Math.floor(Number(e?.n)), min = Math.floor(Number(e?.min));
    if (Number.isFinite(n) && n > 0 && n <= 99 && Number.isFinite(min) && min >= 0 && min <= 99 * 60) out[d] = { n, min };
  }
  return out;
}

/** Soma UM "foquei" ao dia; devolve o mapa novo (puro). Teto de 99 por dia, só sanidade. */
export function recordSession(days: FocoDays, day: string, minutes: number): FocoDays {
  if (!isDayKey(day)) return days;
  const cur = days[day] ?? { n: 0, min: 0 };
  if (cur.n >= 99) return days;
  return normalizeSessions({ ...days, [day]: { n: cur.n + 1, min: cur.min + Math.max(0, Math.round(minutes)) } });
}

export const sessionsToday = (days: FocoDays, day: string): number => days[day]?.n ?? 0;
export const loadSessions = (): FocoDays => normalizeSessions(readJson<unknown>(STORAGE_KEYS.FOCO_SESSIONS, {}));
export const saveSessions = (d: FocoDays): void => { writeJson(STORAGE_KEYS.FOCO_SESSIONS, d, { silent: true }); };

/** Depois do N-ésimo foco do dia, a pausa é longa? (só no modo 25/5). */
export const isLongBreak = (mode: FocoModeId, countToday: number): boolean =>
  mode === 'p25' && countToday > 0 && countToday % LONG_BREAK_EVERY === 0;

// ── O aviso de fim (módulo, para sobreviver à folha fechada) ─────────────────
let armed: ReturnType<typeof setTimeout> | null = null;
export interface EndNoticeCopy { title: string; body: string }

/** A vibração ao fim está ligada? Padrão LIGADA (só `'false'` desliga) — interruptor em Configurações. */
export const isVibrateOn = (): boolean => readLocal(STORAGE_KEYS.FOCO_VIBRATE) !== 'false';
export const setVibrateOn = (on: boolean): void => { writeLocal(STORAGE_KEYS.FOCO_VIBRATE, on ? 'true' : 'false', { silent: true }); };

/** O que acontece quando chega a zero: notificação local SÓ com permissão já concedida + vibração curta (se ligada). */
export function fireEndNotice(copy: EndNoticeCopy): void {
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') showNotification(copy.title, { body: copy.body, tag: 'foco-fim' }); } catch { /* sem notificação: o aviso é o da tela */ }
  try { if (isVibrateOn()) navigator.vibrate?.(180); } catch { /* sem vibração */ }
}

/** Agenda o aviso para `endAt`. Reagendar cancela o anterior. Timeout só DISPARA; a conta é do relógio. */
export function armEndNotice(endAt: number, now: number, copy: EndNoticeCopy): void {
  disarmEndNotice();
  armed = setTimeout(() => { armed = null; fireEndNotice(copy); }, Math.max(0, endAt - now));
}
export function disarmEndNotice(): void {
  if (armed !== null) { clearTimeout(armed); armed = null; }
}
