/**
 * O CLIENTE DOS PRÉDIOS DO CLÃ (D-10, D-11, D-14..D-18) — Praça, Plantio e Mistério.
 *
 * Fala com `/api/guild` (`functions/api/_claPraca.js`, `_claPlantio.js`, `_claMisterio.js`) pelo MESMO
 * `guildCall` das demais ações da guilda: o token, o 410 de conta excluída, o 200 ilegível como falha.
 * Tudo o que chega é DADO NÃO CONFIÁVEL: cada `sanitize*` devolve o tipo estreito e descarta o resto.
 *
 * Nenhuma vista carrega número por pessoa: a Praça manda ids opacos de membro, o Plantio só o estado
 * coletivo e o que é SEU, o Mistério só a barra coletiva (0..99).
 */
import { PLANT_SPECIES, migrarEspecie, type PlantSpecies } from './plantSpecies';
import { guildCall, dia } from './community';
import type { PlayerDayAnchor } from './playerDay';

// ── O prêmio (presente, fruto, mistério): a forma que o servidor sorteia ─────
export type ClaReward =
  | { kind: 'bits'; amount: number }
  | { kind: 'decor'; id: string }
  | { kind: 'chip'; id: 'chip-power' | 'chip-harmony' | 'chip-benevolence' }
  | { kind: 'food' };

const DECOR_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/;
const CHIPS = ['chip-power', 'chip-harmony', 'chip-benevolence'] as const;

export function sanitizeReward(raw: unknown): ClaReward | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { kind?: unknown; id?: unknown; amount?: unknown };
  if (r.kind === 'bits' && typeof r.amount === 'number' && Number.isInteger(r.amount) && r.amount > 0 && r.amount <= 1000) return { kind: 'bits', amount: r.amount };
  if (r.kind === 'decor' && typeof r.id === 'string' && DECOR_RE.test(r.id)) return { kind: 'decor', id: r.id };
  if (r.kind === 'chip' && (CHIPS as readonly unknown[]).includes(r.id)) return { kind: 'chip', id: r.id as (typeof CHIPS)[number] };
  if (r.kind === 'food') return { kind: 'food' };
  return null;
}

const receiptOf = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 && v.length <= 120 ? v : null);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

// ── PRAÇA ────────────────────────────────────────────────────────────────────
export const PRACA_SLOTS = 4;

export interface PracaSlot { slot: number; item: string | null; /** id opaco de quem pôs */ by: string | null; mine: boolean }
export interface PracaGift { id: string; /** id opaco do remetente */ from: string; day: string; item: ClaReward }
export interface PracaView { slots: PracaSlot[]; gifts: PracaGift[]; /** ids opacos que EU já presenteei hoje */ sentToday: string[] }

export function sanitizePraca(raw: unknown): PracaView {
  const r = obj(raw);
  const slots: PracaSlot[] = Array.from({ length: PRACA_SLOTS }, (_, i) => ({ slot: i, item: null, by: null, mine: false }));
  if (Array.isArray(r.slots)) {
    for (const s of r.slots) {
      const o = obj(s);
      if (typeof o.slot === 'number' && Number.isInteger(o.slot) && o.slot >= 0 && o.slot < PRACA_SLOTS) {
        slots[o.slot] = {
          slot: o.slot,
          item: typeof o.item === 'string' && DECOR_RE.test(o.item) ? o.item : null,
          by: typeof o.by === 'string' ? o.by.slice(0, 40) : null,
          mine: o.mine === true,
        };
      }
    }
  }
  const gifts: PracaGift[] = [];
  if (Array.isArray(r.gifts)) {
    for (const g of r.gifts.slice(0, 40)) {
      const o = obj(g);
      const item = sanitizeReward(o.item);
      if (typeof o.id === 'string' && o.id.length <= 80 && typeof o.from === 'string' && typeof o.day === 'string' && item) {
        gifts.push({ id: o.id, from: o.from.slice(0, 40), day: o.day.slice(0, 10), item });
      }
    }
  }
  const mine = obj(r.mine);
  const sentToday = Array.isArray(mine.sentToday) ? mine.sentToday.filter((x): x is string => typeof x === 'string').slice(0, 24) : [];
  return { slots, gifts, sentToday };
}

export const getPraca = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ praca?: unknown }>('claPraca', { params: { id, dayKey: dia(tz) } }).then(r => sanitizePraca(r.praca));

/** Põe (ou tira, com `null`) um item no lugar `slot` (0..3) da praça. */
export const setPracaSlot = (id: string, slot: number, item: string | null, tz?: PlayerDayAnchor) =>
  guildCall<{ praca?: unknown }>('claPracaSlot', { method: 'POST', body: { id, dayKey: dia(tz), slot, item } }).then(r => sanitizePraca(r.praca));

/** O presente diário a UM membro (`to` = id opaco do membro). 409 = já enviou hoje. */
export const sendPresente = (id: string, to: string, tz?: PlayerDayAnchor) =>
  guildCall<{ praca?: unknown }>('claPresente', { method: 'POST', body: { id, dayKey: dia(tz), to } }).then(r => sanitizePraca(r.praca));

export interface PracaClaim { reward: ClaReward; receipt: string; praca: PracaView }
/** Abre um presente recebido. O crédito no save é do chamador, UMA vez por `receipt`. */
export const claimPresente = (id: string, giftId: string, tz?: PlayerDayAnchor): Promise<PracaClaim | null> =>
  guildCall<{ claimed?: unknown; praca?: unknown }>('claPresenteClaim', { method: 'POST', body: { id, dayKey: dia(tz), giftId } }).then(r => {
    const c = obj(r.claimed);
    const reward = sanitizeReward(c.item);
    const receipt = receiptOf(c.receipt);
    return reward && receipt ? { reward, receipt, praca: sanitizePraca(r.praca) } : null;
  });

// ── PLANTIO ──────────────────────────────────────────────────────────────────
export { PLANT_SPECIES, ESPECIE_LEGADO, migrarEspecie, type PlantSpecies } from './plantSpecies';
export const PLANT_SEASONS = ['primavera', 'verao', 'outono', 'inverno'] as const;
export type PlantSeason = (typeof PLANT_SEASONS)[number];

export interface PlantioView {
  season: PlantSeason;
  species: PlantSpecies;
  planted: boolean;
  canPlant: boolean;
  /** 0..3 crescendo, 4 madura. */
  stage: number;
  mature: boolean;
  /** 0..100, coletivo. */
  progress: number;
  delayed: boolean;
  level: number | null;
  tier: number | null;
  /** Regada o bastante hoje / protegida hoje (coletivo). */
  waterOk: boolean;
  protectedToday: boolean;
  /** SEU: já reguei hoje / posso colher esta semana. */
  wateredToday: boolean;
  canHarvest: boolean;
}

const int = (v: unknown, lo: number, hi: number): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : null);

export function sanitizePlantio(raw: unknown): PlantioView | null {
  const r = obj(raw);
  const sp = migrarEspecie(r.species);
  const species = (PLANT_SPECIES as readonly unknown[]).includes(sp) ? (sp as PlantSpecies) : null;
  const season = (PLANT_SEASONS as readonly unknown[]).includes(r.season) ? (r.season as PlantSeason) : null;
  if (!species || !season) return null;
  const today = obj(r.today);
  const mine = obj(r.mine);
  return {
    season, species,
    planted: r.planted === true,
    canPlant: r.canPlant === true,
    stage: int(r.stage, 0, 4) ?? 0,
    mature: r.mature === true,
    progress: int(r.progress, 0, 100) ?? 0,
    delayed: r.delayed === true,
    level: int(r.level, 0, 99),
    tier: int(r.tier, 0, 9),
    waterOk: today.waterOk === true,
    protectedToday: today.protectedToday === true,
    wateredToday: mine.wateredToday === true,
    canHarvest: mine.canHarvest === true,
  };
}

export const getPlantio = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ plantio?: unknown }>('claPlantio', { params: { id, dayKey: dia(tz) } }).then(r => sanitizePlantio(r.plantio));

export type PlantioAction = 'claPlantar' | 'claRegar' | 'claProteger' | 'claColher';
export interface FruitHarvest { id: string; tier: number; bits: number; receipt: string }
export interface PlantioResult { plantio: PlantioView | null; fruit: FruitHarvest | null }

/** Planta, rega, protege ou colhe. 409 (já feito) chega como `GuildError` com `status` 409. */
export const actPlantio = (action: PlantioAction, id: string, tz?: PlayerDayAnchor): Promise<PlantioResult> =>
  guildCall<{ plantio?: unknown; fruit?: unknown; receipt?: unknown }>(action, { method: 'POST', body: { id, dayKey: dia(tz) } }).then(r => {
    const f = obj(r.fruit);
    const receipt = receiptOf(r.receipt);
    const bits = int(f.bits, 0, 1000);
    const fruit = receipt && bits !== null && typeof f.id === 'string' ? { id: f.id.slice(0, 60), tier: int(f.tier, 0, 9) ?? 0, bits, receipt } : null;
    return { plantio: sanitizePlantio(r.plantio), fruit };
  });

// ── MISTÉRIO ─────────────────────────────────────────────────────────────────
export interface MisterioView {
  /** 0..99, coletiva. */
  bar: number;
  round: number;
  /** Quantos Soulmons do clã investigam — só para dizer "há alguém", nunca mostrado como número. */
  investigating: number;
  sent: boolean;
  rewardPending: boolean;
  capReached: boolean;
}

export function sanitizeMisterio(raw: unknown): MisterioView | null {
  const r = obj(raw);
  const bar = int(r.bar, 0, 99);
  if (bar === null) return null;
  const mine = obj(r.mine);
  return {
    bar, round: int(r.round, 0, 1_000_000) ?? 0, investigating: int(r.investigating, 0, 12) ?? 0,
    sent: mine.sent === true, rewardPending: mine.rewardPending === true, capReached: mine.capReached === true,
  };
}

export const getMisterio = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ misterio?: unknown }>('claMisterio', { params: { id, dayKey: dia(tz) } }).then(r => sanitizeMisterio(r.misterio));

export const sendMisterio = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ misterio?: unknown }>('claMisterioEnviar', { method: 'POST', body: { id, dayKey: dia(tz) } }).then(r => sanitizeMisterio(r.misterio));

export interface MisterioClaim { reward: ClaReward; receipt: string; misterio: MisterioView | null }
export const claimMisterio = (id: string, tz?: PlayerDayAnchor): Promise<MisterioClaim | null> =>
  guildCall<{ claimed?: unknown; misterio?: unknown }>('claMisterioClaim', { method: 'POST', body: { id, dayKey: dia(tz) } }).then(r => {
    const c = obj(r.claimed);
    const reward = sanitizeReward(c.reward);
    const receipt = receiptOf(c.receipt);
    return reward && receipt ? { reward, receipt, misterio: sanitizeMisterio(r.misterio) } : null;
  });

/**
 * Conta UMA tarefa concluída na barra do Mistério. Fire-and-forget: o servidor é idempotente por `taskId`
 * (ids de hoje e ontem) e tem teto diário; sem rede, sem login ou sem clã, a falha é ignorada em silêncio —
 * a conclusão da tarefa nunca depende disto.
 */
export function countMisterioTask(saveId: string, taskId: string, tz?: PlayerDayAnchor): void {
  const id = taskId.replace(/[^A-Za-z0-9_:.-]/g, '_').slice(0, 64);
  if (!saveId || !id) return;
  void guildCall('claMisterioTarefa', { method: 'POST', body: { id: saveId, dayKey: dia(tz), taskId: id } }).catch(() => undefined);
}
