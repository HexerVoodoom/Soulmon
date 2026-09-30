/**
 * REVISÃO DA MALHA — recuperação espaçada dos cartões DO PRÓPRIO JOGADOR
 * (`docs/BENCHMARK-MINIJOGOS.md` §6.1). Leitner de 5 caixas: lembrou → o
 * cartão sobe uma caixa e volta mais tarde; não lembrou → caixa 1, volta amanhã.
 *
 * Tudo PURO: sem React, sem localStorage, sem relógio — `todayKey` ('YYYY-MM-DD')
 * vem SEMPRE por parâmetro (quem chama decide o dia; ver `utils/playerDay.ts`).
 *
 * Linha vermelha: NÃO existe contador de dias seguidos aqui, nem vai existir
 * (streak que zera desfaz a tese do produto — risco "virar Duolingo" do §6.1).
 * Os Bits são por SESSÃO, uma vez por dia — nunca "N cartões = N pontos".
 */

export interface ReviewCard {
  id: string;
  front: string;
  back: string;
  /** Caixa de Leitner, 1..REVIEW_BOXES. */
  box: number;
  /** Dia em que volta ('YYYY-MM-DD'). */
  due: string;
  /** Dia em que foi criado ('YYYY-MM-DD'). */
  createdAt: string;
}

export interface ReviewState {
  cards: ReviewCard[];
  /** Último dia em que uma sessão foi concluída — só para pagar 1×/dia. */
  lastSessionDay?: string;
}

export const REVIEW_BOXES = 5;
/** Intervalo (dias) de cada caixa: índice 0 = caixa 1. */
export const REVIEW_INTERVAL_DAYS: readonly number[] = Object.freeze([1, 2, 4, 8, 16]);
export const REVIEW_SESSION_SIZE = 5;
export const REVIEW_MAX_CARDS = 200;
export const REVIEW_TEXT_MAX = 140;
export const REVIEW_SESSION_BITS = 5;
export const REVIEW_EMPTY: ReviewState = Object.freeze({ cards: Object.freeze([]) as unknown as ReviewCard[] });

const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** 'YYYY-MM-DD' válido de verdade (rejeita 2026-02-30). */
export function isDayKey(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const m = DAY_KEY_RE.exec(v);
  if (!m) return false;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Soma `n` dias a um dia 'YYYY-MM-DD' em UTC puro (sem fuso do aparelho). */
export function addDays(dayKey: string, n: number): string {
  const m = DAY_KEY_RE.exec(dayKey);
  if (!m) return dayKey;
  const base = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const t = new Date(base + Math.trunc(n) * DAY_MS);
  const y = String(t.getUTCFullYear()).padStart(4, '0');
  const mo = String(t.getUTCMonth() + 1).padStart(2, '0');
  const d = String(t.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function cleanText(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, REVIEW_TEXT_MAX).trim();
}

function clampBox(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(REVIEW_BOXES, Math.max(1, Math.round(n)));
}

/**
 * Higieniza o que vem do save/nuvem. Nunca lança: descarta cartão malformado
 * (sem id, sem texto, sem dia válido), prende a caixa, corta o texto, remove
 * id repetido e limita a quantidade.
 */
export function sanitizeReview(raw: unknown): ReviewState {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { cards: [] };
    const obj = raw as { cards?: unknown; lastSessionDay?: unknown };
    const out: ReviewCard[] = [];
    const seen = new Set<string>();
    if (Array.isArray(obj.cards)) {
      // Varre no máximo um múltiplo do teto — lixo gigante não trava a carga.
      const limit = Math.min(obj.cards.length, REVIEW_MAX_CARDS * 5);
      for (let i = 0; i < limit && out.length < REVIEW_MAX_CARDS; i++) {
        const c = obj.cards[i] as Record<string, unknown> | null;
        if (!c || typeof c !== 'object') continue;
        const id = typeof c.id === 'string' ? c.id.trim().slice(0, 80) : '';
        if (!id || seen.has(id)) continue;
        const front = cleanText(c.front);
        const back = cleanText(c.back);
        if (!front || !back) continue;
        const due = isDayKey(c.due) ? c.due : isDayKey(c.createdAt) ? c.createdAt : null;
        if (!due) continue;
        const createdAt = isDayKey(c.createdAt) ? c.createdAt : due;
        seen.add(id);
        out.push({ id, front, back, box: clampBox(c.box), due, createdAt });
      }
    }
    const state: ReviewState = { cards: out };
    if (isDayKey(obj.lastSessionDay)) state.lastSessionDay = obj.lastSessionDay;
    return state;
  } catch {
    return { cards: [] };
  }
}

/** Novo cartão, que vale para hoje. Recusa (mesma referência) texto vazio, teto ou id repetido. */
export function addCard(s: ReviewState, front: string, back: string, todayKey: string, id: string): ReviewState {
  const f = cleanText(front);
  const b = cleanText(back);
  if (!f || !b || !id || !isDayKey(todayKey)) return s;
  if (s.cards.length >= REVIEW_MAX_CARDS) return s;
  if (s.cards.some(c => c.id === id)) return s;
  return { ...s, cards: [...s.cards, { id, front: f, back: b, box: 1, due: todayKey, createdAt: todayKey }] };
}

/** Troca o texto; caixa e dia de volta ficam. Recusa texto vazio ou id inexistente. */
export function editCard(s: ReviewState, id: string, front: string, back: string): ReviewState {
  const f = cleanText(front);
  const b = cleanText(back);
  if (!f || !b) return s;
  const i = s.cards.findIndex(c => c.id === id);
  if (i < 0) return s;
  const cur = s.cards[i];
  if (cur.front === f && cur.back === b) return s;
  const cards = s.cards.slice();
  cards[i] = { ...cur, front: f, back: b };
  return { ...s, cards };
}

export function removeCard(s: ReviewState, id: string): ReviewState {
  if (!s.cards.some(c => c.id === id)) return s;
  return { ...s, cards: s.cards.filter(c => c.id !== id) };
}

/** Os cartões do dia: caixa mais baixa primeiro, depois o mais antigo, desempate por id. */
export function dueCards(s: ReviewState, todayKey: string): ReviewCard[] {
  return s.cards
    .filter(c => c.due <= todayKey)
    .sort((a, b) => a.box - b.box || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, REVIEW_SESSION_SIZE);
}

/** Leitner: lembrou → sobe uma caixa e volta no intervalo dela; não → caixa 1, amanhã. */
export function answerCard(s: ReviewState, id: string, remembered: boolean, todayKey: string): ReviewState {
  const i = s.cards.findIndex(c => c.id === id);
  if (i < 0 || !isDayKey(todayKey)) return s;
  const cur = s.cards[i];
  const box = remembered ? Math.min(REVIEW_BOXES, cur.box + 1) : 1;
  const due = remembered ? addDays(todayKey, REVIEW_INTERVAL_DAYS[box - 1]) : addDays(todayKey, 1);
  const cards = s.cards.slice();
  cards[i] = { ...cur, box, due };
  return { ...s, cards };
}

/** Fecha a sessão. Paga `REVIEW_SESSION_BITS` só na primeira sessão do dia. */
export function completeSession(s: ReviewState, todayKey: string): { state: ReviewState; bits: number } {
  if (s.lastSessionDay === todayKey) return { state: s, bits: 0 };
  return { state: { ...s, lastSessionDay: todayKey }, bits: REVIEW_SESSION_BITS };
}
