/**
 * A FEIRA: O CHEFE E O DESAFIO, lado do CLIENTE (`docs/PLANO-FEIRA-CHEFE.md`; servidor em `functions/api/_feira.js`).
 *
 * Puro: tipos, sanitizadores (dado do servidor nunca é confiável), o mapa `log do servidor → FightEvent` e a
 * chave do "já mostrei". Nada de React, nada de rede (os wrappers moram em `community.ts`).
 *
 * Tudo isto é INERTE com a Feira desligada: sem `evento` na resposta o sanitizador devolve `null` e o app se
 * comporta exatamente como antes. Só AGREGADO do clã e o que é da própria pessoa (LV-G1): nenhum tipo aqui tem
 * onde carregar dado por membro.
 */
import type { FightEvent } from './combate/fight';
import { anchorOffsetMs, deviceOffsetMs, type PlayerDayAnchor } from './playerDay';

const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
const int = (v: unknown, lo: number, hi: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : lo;
  return Math.min(hi, Math.max(lo, n));
};
const slug = (v: unknown): string | null => (typeof v === 'string' && SLUG.test(v) ? v : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

function pct(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 100;
  return Math.min(100, Math.max(0, n));
}

export const FEIRA_TRAIL_GAMES = ['picross', 'zip', 'patches', 'troca', 'eco'] as const;
export type FeiraTrailGame = (typeof FEIRA_TRAIL_GAMES)[number];

/** O evento que a VOLTA da Missão encontra (ou que a folha relê). */
export type FeiraEvento =
  | { k: number; kind: 'boss'; level: number; bossId: string; element: string; bossHpPct: number; canAttack: boolean }
  | { k: number; kind: 'trail'; level: number; trail: { pending: boolean; cleared: boolean; marks: number }; /** Informativo: NUNCA trava a Missão. */ gate: 'locked' | null }
  | { k: number; kind: 'rest'; level: number; claimable: boolean; claimK: number | null };

export function sanitizeFeiraEvento(raw: unknown): FeiraEvento | null {
  const r = obj(raw);
  if (!r) return null;
  const k = int(r.k, 0, 1_000_000);
  const level = int(r.level, 1, 20);
  if (r.kind === 'boss') {
    const bossId = slug(r.bossId);
    if (!bossId) return null;
    return { k, kind: 'boss', level, bossId, element: slug(r.element) ?? 'neutro', bossHpPct: pct(r.bossHpPct), canAttack: r.canAttack === true };
  }
  if (r.kind === 'trail') {
    const t = obj(r.trail) ?? {};
    return { k, kind: 'trail', level, trail: { pending: t.pending === true, cleared: t.cleared === true, marks: int(t.marks, 0, 999) }, gate: r.gate === 'locked' ? 'locked' : null };
  }
  if (r.kind === 'rest') {
    const claimable = r.claimable === true;
    return { k, kind: 'rest', level, claimable, claimK: claimable && typeof r.claimK === 'number' ? int(r.claimK, 0, 1_000_000) : null };
  }
  return null;
}

/** A vista segura (`guild.feira`): estado e agregados, mostrada na sala da Feira. */
export type FeiraResumo =
  | { state: 'boss'; level: number; bossId: string; bossHpPct: number }
  | { state: 'trail'; level: number; marks: number }
  | { state: 'rest'; level: number };

export function sanitizeFeiraResumo(raw: unknown): FeiraResumo | null {
  const r = obj(raw);
  if (!r) return null;
  const level = int(r.level, 1, 20);
  if (r.state === 'boss') {
    const bossId = slug(r.bossId);
    return bossId ? { state: 'boss', level, bossId, bossHpPct: pct(r.bossHpPct) } : null;
  }
  if (r.state === 'trail') return { state: 'trail', level, marks: int(r.marks, 0, 999) };
  if (r.state === 'rest') return { state: 'rest', level };
  return null;
}

/** Uma linha do registro do servidor: `k` a=ataque c=conjuro t=dano contínuo; `s` lado; `f` fração. */
export interface FeiraLogEntry { k: 'a' | 'c' | 't'; t: number; s: 0 | 1; f: number }

export interface FeiraAttack {
  /** Dano do PRÓPRIO golpe. */
  dmg: number;
  log: FeiraLogEntry[];
  seconds: number;
  boss: { bossId: string; level: number; bossHpPct: number; dead: boolean };
  evento: FeiraEvento | null;
}

const LOG_MAX = 400;

export function sanitizeFeiraAttack(raw: unknown): FeiraAttack | null {
  const r = obj(raw);
  const a = obj(r?.attack);
  const b = obj(r?.boss);
  if (!r || !a || !b || r.landed !== true) return null;
  const bossId = slug(b.bossId);
  if (!bossId) return null;
  const log: FeiraLogEntry[] = [];
  for (const e of Array.isArray(a.log) ? a.log.slice(0, LOG_MAX) : []) {
    const o = obj(e);
    if (!o || (o.k !== 'a' && o.k !== 'c' && o.k !== 't') || typeof o.t !== 'number' || !Number.isFinite(o.t) || (o.s !== 0 && o.s !== 1)) continue;
    log.push({ k: o.k, t: Math.min(120, Math.max(0, o.t)), s: o.s, f: typeof o.f === 'number' && Number.isFinite(o.f) ? Math.min(1, Math.max(0, o.f)) : 0 });
  }
  return {
    dmg: int(a.dmg, 0, 100_000),
    log,
    seconds: int(a.seconds, 1, 120),
    boss: { bossId, level: int(b.level, 1, 20), bossHpPct: pct(b.bossHpPct), dead: b.dead === true },
    evento: sanitizeFeiraEvento(r.evento),
  };
}

/**
 * O registro do servidor no formato que a `BossFightScreen` toca (`FightEvent`). Só apresentação: o dano já está fechado
 * no servidor. O HP do SEU bicho desce com os golpes do lado 1; o do chefe é só informativo (a barra do clã vem de `poolPct*`).
 */
export function mapFeiraLog(log: readonly FeiraLogEntry[]): FightEvent[] {
  const ordered = [...log].sort((x, y) => x.t - y.t);
  let me = 1;
  let foe = 1;
  const out: FightEvent[] = [];
  for (const e of ordered) {
    const hit = e.k === 'a' || e.k === 't';
    if (hit && e.s === 1) me = Math.max(0, me - e.f);
    if (hit && e.s === 0) foe = Math.max(0, foe - e.f);
    out.push({
      kind: e.k === 'a' ? 'attack' : e.k === 'c' ? 'cast' : 'tick',
      t: e.t,
      side: e.s,
      frac: hit ? e.f : 0,
      hp: [me, foe],
      energy: [0, 0],
    });
  }
  return out;
}

const sanitizeFeiraEssences = (v: unknown): Array<{ id: string; n: number }> =>
  Array.isArray(v) ? v.slice(0, 4).flatMap(e => { const o = obj(e); const id = o ? slug(o.id) : null; return o && id ? [{ id, n: int(o.n, 1, 100) }] : []; }) : [];

export interface FeiraReward { emblems: number; bits: number; sap: number; trophyId: string | null; element: string | null; essences: Array<{ id: string; n: number }> }
export interface FeiraClaim { k: number; level: number; bossId: string; receipt: string; reward: FeiraReward }

export function sanitizeFeiraClaim(raw: unknown): FeiraClaim | null {
  const c = obj(raw);
  if (!c || typeof c.receipt !== 'string' || !c.receipt) return null;
  const bossId = slug(c.bossId);
  const w = obj(c.reward) ?? {};
  if (!bossId) return null;
  return {
    k: int(c.k, 0, 1_000_000),
    level: int(c.level, 1, 20),
    bossId,
    receipt: c.receipt.slice(0, 80),
    reward: {
      emblems: int(w.emblems, 0, 50),
      bits: int(w.bits, 0, 1000),
      sap: int(w.sap, 0, 1000),
      trophyId: typeof w.trophyId === 'string' && w.trophyId ? w.trophyId.slice(0, 40) : null,
      element: slug(w.element),
      essences: sanitizeFeiraEssences(w.essences),
    },
  };
}

// ── a Trilha ────────────────────────────────────────────────────────────────

export interface ZipInstance { size: number; numbers: number[] }
export interface PatchClueIn { cell: number; area: number; shape: 'square' | 'tall' | 'wide' | 'any' }
export interface PatchesInstance { size: number; clues: PatchClueIn[] }
export interface PicrossInstance { size: number; rows: number[][]; cols: number[][] }
export interface TrocaCardIn { forma: 'young' | 'grown'; lugar: 'sky' | 'cave'; rule: 'forma' | 'lugar'; art: number }
export interface TrocaInstance { deck: TrocaCardIn[] }
export interface EcoInstance { par: number }

export type FeiraTrail =
  | { k: number; game: 'zip'; seed: number; puzzle: ZipInstance }
  | { k: number; game: 'patches'; seed: number; puzzle: PatchesInstance }
  | { k: number; game: 'picross'; seed: number; puzzle: PicrossInstance }
  | { k: number; game: 'troca'; seed: number; puzzle: TrocaInstance }
  | { k: number; game: 'eco'; seed: number; puzzle: EcoInstance };

const ints = (v: unknown, lo: number, hi: number, max: number): number[] => (Array.isArray(v) ? v.slice(0, max).map(x => int(x, lo, hi)) : []);
const clueLines = (v: unknown, size: number): number[][] => (Array.isArray(v) ? v.slice(0, size).map(l => ints(l, 0, size, size)) : []);

export function sanitizeFeiraTrail(raw: unknown): FeiraTrail | null {
  const t = obj(raw);
  const p = obj(t?.puzzle);
  if (!t || !p) return null;
  const k = int(t.k, 0, 1_000_000);
  const seed = typeof t.seed === 'number' && Number.isFinite(t.seed) ? t.seed >>> 0 : 0;
  switch (t.game) {
    case 'zip': {
      const size = int(p.size, 4, 8);
      const numbers = ints(p.numbers, 0, size * size - 1, 12);
      return numbers.length >= 2 ? { k, game: 'zip', seed, puzzle: { size, numbers } } : null;
    }
    case 'patches': {
      const size = int(p.size, 4, 8);
      const clues: PatchClueIn[] = (Array.isArray(p.clues) ? p.clues.slice(0, size * size) : []).map(c => {
        const o = obj(c) ?? {};
        const shape: PatchClueIn['shape'] = o.shape === 'square' || o.shape === 'tall' || o.shape === 'wide' ? o.shape : 'any';
        return { cell: int(o.cell, 0, size * size - 1), area: int(o.area, 1, size * size), shape };
      });
      return clues.length > 0 ? { k, game: 'patches', seed, puzzle: { size, clues } } : null;
    }
    case 'picross': {
      const size = int(p.size, 3, 10);
      const rows = clueLines(p.rows, size);
      const cols = clueLines(p.cols, size);
      return rows.length === size && cols.length === size ? { k, game: 'picross', seed, puzzle: { size, rows, cols } } : null;
    }
    case 'troca': {
      const deck: TrocaCardIn[] = (Array.isArray(p.deck) ? p.deck.slice(0, 60) : []).map(c => {
        const o = obj(c) ?? {};
        return {
          forma: o.forma === 'grown' ? 'grown' : 'young',
          lugar: o.lugar === 'cave' ? 'cave' : 'sky',
          rule: o.rule === 'lugar' ? 'lugar' : 'forma',
          art: int(o.art, 0, 255),
        };
      });
      return deck.length >= 10 ? { k, game: 'troca', seed, puzzle: { deck } } : null;
    }
    case 'eco':
      return { k, game: 'eco', seed, puzzle: { par: int(p.par, 3, 12) } };
    default:
      return null;
  }
}

/** A solução, no formato que `guildFeiraTrailDone` confere. */
export type FeiraSolution =
  | { path: number[] }
  | { rects: Array<{ r: number; c: number; h: number; w: number }> }
  | { cells: number[][] }
  | { sides: Array<'left' | 'right'> }
  | { score: number };

/** Tempo mínimo (ms) entre `start` e `done` por jogo — espelha `TRAIL_MIN_MS` do servidor. O cliente ESPERA este piso antes de enviar. */
export const FEIRA_TRAIL_MIN_MS: Readonly<Record<FeiraTrailGame, number>> = Object.freeze({ picross: 8000, zip: 4000, patches: 4000, troca: 10000, eco: 6000 });

export interface FeiraTrailDone { reward: { emblems: number; sap: number }; receipt: string; evento: FeiraEvento | null }

export function sanitizeFeiraTrailDone(raw: unknown): FeiraTrailDone | null {
  const r = obj(raw);
  if (!r || r.cleared !== true) return null;
  const w = obj(r.reward) ?? {};
  return {
    reward: { emblems: int(w.emblems, 0, 20), sap: int(w.sap, 0, 100) },
    receipt: typeof r.receipt === 'string' ? r.receipt.slice(0, 80) : '',
    evento: sanitizeFeiraEvento(r.evento),
  };
}

/** Chave do "já mostrei": o mesmo mistério no mesmo dia não reabre sozinho (marcada ao MOSTRAR). */
export const feiraShownKey = (e: FeiraEvento, dayKey: string): string => `${e.k}:${e.kind}:${dayKey}`;

/** O evento merece a tela de volta? Descanso sem resgate e trilha já cumprida ficam em silêncio (a sala conta o resto). */
export function feiraEventoAbre(e: FeiraEvento | null): boolean {
  if (!e) return false;
  if (e.kind === 'boss') return e.canAttack;
  if (e.kind === 'trail') return e.trail.pending && !e.trail.cleared;
  return e.claimable;
}

/**
 * O PRÓXIMO INSTANTE em que o dia do jogador vira (meia-noite na âncora do save): a Missão/Chefe/Desafio são 1×/dia, então
 * "quando volta a ter ação" = esta virada. Sem âncora, a meia-noite do aparelho. Pura: `now` por parâmetro.
 */
export function nextPlayerDayStart(now: Date, anchor: PlayerDayAnchor | undefined): Date {
  const off = anchorOffsetMs(anchor, now) ?? deviceOffsetMs(now);
  const shifted = new Date(now.getTime() + off);
  const nextMidnightUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1);
  return new Date(nextMidnightUtc - off);
}
