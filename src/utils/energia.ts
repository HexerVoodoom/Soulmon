/**
 * ENERGIA — a barra de ENERGIA de cada lutador e a "barra de CHEER" do jogador
 * (decisão do dono, 04/10/2026 — `docs/REGISTRO-DE-DECISOES.md` §20.10).
 *
 * ## O modelo (uma frase por peça)
 *
 *  · Cada lutador tem UMA barra de ENERGIA (0..`ENERGY_MAX`). Ela enche por três
 *    fatores: cada ataque DADO (`ENERGY_DEALT`), cada ataque SOFRIDO
 *    (`ENERGY_TAKEN`) e o CHEER (`ENERGY_CHEER`, só do pet do jogador).
 *  · A "barra de CHEER" é o medidor de TOQUES do jogador (`CHEER_TAPS_FULL`, lento de
 *    propósito). Ao encher, ela DESPEJA `ENERGY_CHEER` de energia no pet (um tanto
 *    maior que um ataque dado/sofrido) e zera; o excedente de toques fica. Na
 *    Masmorra o medidor PERSISTE entre os combates da run.
 *  · Energia cheia = o lutador solta o ESPECIAL no golpe seguinte e gasta a barra.
 *
 * ## Duas famílias de luta
 *
 *  · **PvP (duelo fantasma)** — servidor-autoritativo, SEM mecânica ativa: o especial
 *    sai direto. A regra é de `functions/api/_duel.js`; as constantes de energia vivem
 *    LÁ e são só reexportadas aqui (uma regra, um arquivo — footgun 9).
 *  · **PvE (Pesadelo, Masmorra, Duelo da Arena)** — mecânicas ATIVAS, clientes:
 *      - quando a energia do pet enche, o especial pede um ANEL que encolhe sobre o
 *        alvo: o toque no momento certo define o multiplicador (ruim / bom / ótimo);
 *      - quando o INIMIGO solta o especial dele, o jogador pode ESQUIVAR deslizando o
 *        dedo para o lado (ou pelo botão): o momento do gesto reduz o dano.
 *    Sem agir, a defesa automática (`autoDefesa.ts`) segue sendo a base: o ANEL sem
 *    toque vale `ruim`, e o especial do inimigo sem esquiva leva o dano normal.
 *
 * Tudo aqui é PURO e determinístico: o "jeito" de cada anel/esquiva sai da semente da
 * luta (`defenseRoll`), nunca de `Math.random()`.
 */
import {
  DUEL_ENERGY_MAX, DUEL_ENERGY_DEALT, DUEL_ENERGY_TAKEN, DUEL_ENERGY_CHEER, DUEL_TAPS_FULL, DUEL_TAPS_CAP,
} from '../../functions/api/_duel.js';
import { defenseRoll } from './autoDefesa';

// ── a barra de energia (as constantes são as do servidor) ─────────────────────
export const ENERGY_MAX = DUEL_ENERGY_MAX;
export const ENERGY_DEALT = DUEL_ENERGY_DEALT;
export const ENERGY_TAKEN = DUEL_ENERGY_TAKEN;
export const ENERGY_CHEER = DUEL_ENERGY_CHEER;
/** Toques que enchem a barra de CHEER (lenta de propósito). */
export const CHEER_TAPS_FULL = DUEL_TAPS_FULL;
/** Toques contados por janela de golpe (teto anti-auto-clique; vale no PvP, e como régua no PvE). */
export const CHEER_TAPS_CAP = DUEL_TAPS_CAP;

export type EnergyKind = 'dealt' | 'taken' | 'cheer';
const GAIN: Record<EnergyKind, number> = { dealt: ENERGY_DEALT, taken: ENERGY_TAKEN, cheer: ENERGY_CHEER };

/** A energia depois de um fator; nunca passa de `ENERGY_MAX`. */
export function addEnergy(energy: number, kind: EnergyKind): number {
  return Math.min(ENERGY_MAX, Math.max(0, (Number.isFinite(energy) ? energy : 0) + GAIN[kind]));
}
export const energyFull = (energy: number): boolean => energy >= ENERGY_MAX;
/** 0..1 para a barra. */
export const energyRatio = (energy: number): number => Math.min(1, Math.max(0, energy) / ENERGY_MAX);
/** Gasta a barra no especial (o excedente, se houver, fica). */
export const spendEnergy = (energy: number): number => Math.max(0, energy - ENERGY_MAX);

export interface CheerTap { meter: number; discharged: boolean }
/**
 * Um toque na barra de CHEER. Ao encher (`CHEER_TAPS_FULL`) ela "despeja" energia no pet
 * (`discharged`) e o excedente fica. Pura: quem chama guarda `meter` e soma a energia.
 */
export function cheerTap(meter: number): CheerTap {
  const m = Math.max(0, Math.floor(Number.isFinite(meter) ? meter : 0)) + 1;
  return m >= CHEER_TAPS_FULL ? { meter: m - CHEER_TAPS_FULL, discharged: true } : { meter: m, discharged: false };
}
/** 0..1 para a barra de CHEER. */
export const cheerRatio = (meter: number): number => Math.min(1, Math.max(0, meter) / CHEER_TAPS_FULL);

// ── PvE: números de luta ──────────────────────────────────────────────────────

/**
 * As lutas de PvE ficaram mais LONGAS (04/10/2026): vida do pet e do inimigo × `PVE_HP_SCALE`
 * (o dano por golpe NÃO muda — são mais golpes para a mesma curva). Alvo: ~20–30 s por
 * inimigo (cada ida-e-volta ≈ 3,4 s na cena). A conta antes/depois está em `energia.test.ts`.
 */
export const PVE_HP_SCALE = 1.8;
/**
 * O inimigo também recebe energia pelos ataques (sem cheer) e solta o especial: para o
 * pet NÃO ficar mais forte "de graça" que na curva calibrada (a taxa de vitória sem torcer
 * é a de antes), a vida do inimigo sobe um pouco além do `PVE_HP_SCALE`.
 */
export const PVE_FOE_HP_EXTRA = 1.1;
/** Força do especial do pet em múltiplos do golpe-base (o 3× do dono, `TORCIDA_PVE_SPECIAL_MULT`). */
export const PVE_SPECIAL_MULT = 3;
/** Força do especial do INIMIGO em múltiplos do golpe normal dele. */
export const PVE_FOE_SPECIAL_MULT = 2;

export const pveHp = (base: number): number => Math.max(1, Math.round(base * PVE_HP_SCALE));
export const pveFoeHp = (base: number): number => Math.max(1, Math.round(base * PVE_HP_SCALE * PVE_FOE_HP_EXTRA));

// ── PvE (a): o ANEL do especial do pet ────────────────────────────────────────

export type RingGrade = 'ruim' | 'bom' | 'otimo';
/** O multiplicador que o anel dá sobre o especial (média de um jogador comum ≈ 1). */
export const RING_MULT: Record<RingGrade, number> = { ruim: 0.75, bom: 1, otimo: 1.35 };
/** Tamanho do anel que encolhe no início e quando encosta no alvo (escala 1). */
export const RING_FROM = 2.4;
export const RING_TO = 0.5;
/** A janela do ÓTIMO e do BOM, em ms ao redor do instante em que o anel encosta no alvo. */
export const RING_OTIMO_MS = 120;
export const RING_BOM_MS = 320;

export interface RingSpec {
  /** Duração do anel inteiro (do `RING_FROM` ao `RING_TO`), varia por uso. */
  ms: number;
  /** Quando (ms) o anel encosta no alvo (escala 1). */
  targetMs: number;
}
/** O anel do especial nº `n` da luta: velocidade determinística pela semente. */
export function ringSpec(seed: number, n: number): RingSpec {
  const ms = Math.round(1500 + defenseRoll(seed, 1000 + n) * 600); // 1,5–2,1 s
  return { ms, targetMs: Math.round((ms * (RING_FROM - 1)) / (RING_FROM - RING_TO)) };
}
/** A escala do anel no instante `t` (ms). */
export function ringScale(t: number, spec: RingSpec): number {
  return Math.max(RING_TO, RING_FROM - ((RING_FROM - RING_TO) * Math.max(0, t)) / spec.ms);
}
/** Nota do toque (`null` = não tocou até o fim). */
export function ringGrade(tapMs: number | null, spec: RingSpec): RingGrade {
  if (tapMs === null || !Number.isFinite(tapMs)) return 'ruim';
  const d = Math.abs(tapMs - spec.targetMs);
  return d <= RING_OTIMO_MS ? 'otimo' : d <= RING_BOM_MS ? 'bom' : 'ruim';
}

// ── PvE (b): a ESQUIVA do especial do inimigo ─────────────────────────────────

export type DodgeGrade = 'nada' | 'bom' | 'otimo';
/** Quanto da pancada a esquiva tira (o resto é levado). */
export const DODGE_REDUCE: Record<DodgeGrade, number> = { nada: 0, bom: 0.5, otimo: 0.85 };
/** No último trecho antes do impacto a esquiva é ÓTIMA; antes disso (já com o projétil no ar) é boa. */
export const DODGE_OTIMO_MS = 500;

export interface DodgeSpec {
  /** O inimigo carrega (cast + aura) por `castMs`; só então o projétil sai. */
  castMs: number;
  /** O voo do projétil. */
  flightMs: number;
  /** Quando o golpe CHEGA no pet (`castMs + flightMs`). */
  impactMs: number;
}
export function dodgeSpec(seed: number, n: number): DodgeSpec {
  const castMs = Math.round(1000 + defenseRoll(seed, 2000 + n) * 500);
  const flightMs = 1000;
  return { castMs, flightMs, impactMs: castMs + flightMs };
}
/**
 * Nota do gesto (`swipeMs` = quando o dedo deslizou, desde o começo do golpe; `null` = não
 * deslizou). Só vale com o projétil já no ar (depois do `castMs`) e até o impacto.
 */
export function dodgeGrade(swipeMs: number | null, spec: DodgeSpec): DodgeGrade {
  if (swipeMs === null || !Number.isFinite(swipeMs)) return 'nada';
  if (swipeMs < spec.castMs || swipeMs > spec.impactMs) return 'nada';
  return swipeMs >= spec.impactMs - DODGE_OTIMO_MS ? 'otimo' : 'bom';
}

// ── PvE: o dano ───────────────────────────────────────────────────────────────

/** Fração do `dmg` do estágio que é o golpe-BASE do pet (a de `torcida.ts`, 0,5). */
export const PVE_BASE_FRAC = 0.5;

/** O golpe do pet: base, ou ESPECIAL (× `PVE_SPECIAL_MULT` × nota do anel). `guard` = a casca do inimigo. */
export function pveStrikeDamage(o: { dmg: number; guard?: number; special?: boolean; ring?: RingGrade }): number {
  const mult = o.special ? PVE_SPECIAL_MULT * RING_MULT[o.ring ?? 'bom'] : 1;
  return Math.max(1, Math.round(o.dmg * PVE_BASE_FRAC * mult * (1 - (o.guard ?? 0))));
}

/**
 * O golpe do inimigo no pet, com a defesa automática (`acc`). Golpe normal: `acc ≥ perfect` = bloqueado
 * (0). ESPECIAL: não dá para bloquear de graça — vale `PVE_FOE_SPECIAL_MULT ×` o golpe normal, e
 * a esquiva do jogador tira a parte dela (`DODGE_REDUCE`; mínimo 1).
 */
export function pveFoeHitDamage(o: {
  atk: number; acc: number; perfect: number; reducaoDano?: number; special?: boolean; dodge?: DodgeGrade;
}): { dmg: number; blocked: boolean } {
  const base = Math.max(1, Math.ceil(o.atk * (1 - o.acc)) - (o.reducaoDano ?? 0));
  if (!o.special) return o.acc >= o.perfect ? { dmg: 0, blocked: true } : { dmg: base, blocked: false };
  const full = base * PVE_FOE_SPECIAL_MULT;
  return { dmg: Math.max(1, Math.round(full * (1 - DODGE_REDUCE[o.dodge ?? 'nada']))), blocked: false };
}
