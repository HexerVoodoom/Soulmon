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
 *  · Energia cheia = a PRÓXIMA ação do dono é o ESPECIAL; ela zera a barra e o golpe de
 *    cast não rende `'dealt'` (0 logo depois do cast; sem excedente).
 *
 * ## Duas famílias de luta
 *
 *  · **PvP (duelo fantasma)** — servidor-autoritativo, SEM mecânica ativa: o especial
 *    sai direto. A regra é de `functions/api/_duel.js`; as constantes de energia vivem
 *    LÁ e são só reexportadas aqui (uma regra, um arquivo — footgun 9).
 *  · **PvE (Pesadelo, Masmorra, Arena)** — mecânicas ATIVAS, clientes:
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
import { DODGE_REDUCE_V3, RING_MULT_V3 } from './combate/specials';

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
/**
 * Gasta a barra no especial: SEMPRE volta a 0. Excedente não existe — `addEnergy` trava em
 * `ENERGY_MAX` (PR1b/B1: uma barra cheia = um especial).
 */
export const spendEnergy = (_energy: number): number => 0;
/**
 * A energia do ATOR depois do golpe dele. O golpe de cast (`special`) NÃO rende `'dealt'`:
 * a barra fica em 0 até a próxima ação de alguém (PR1b/B1; mesma regra em `_duel.js`).
 */
export const strikeEnergy = (energy: number, special: boolean): number =>
  special ? spendEnergy(energy) : addEnergy(energy, 'dealt');

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

// ── PvE (a): o ANEL do especial do pet ────────────────────────────────────────

export type RingGrade = 'ruim' | 'bom' | 'otimo';
/**
 * O multiplicador que o anel dá sobre o especial (média de um jogador comum ≈ 1).
 * Combate v3 (PR3b, §2.15 P4 e §2.17): 0,92 / 1 / 1,08 — a habilidade vale no máximo 25pp de vitória.
 * É a tabela do NÚCLEO (`combate/specials.ts`), reexportada aqui para o PvE; um teste trava a igualdade.
 */
export const RING_MULT: Record<RingGrade, number> = { ...RING_MULT_V3 };
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
/**
 * Quanto da pancada a esquiva tira (o resto é levado). Combate v3 (PR3b): 0 / 0,2 / 0,35, a tabela do núcleo.
 */
export const DODGE_REDUCE: Record<DodgeGrade, number> = { ...DODGE_REDUCE_V3 };
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
