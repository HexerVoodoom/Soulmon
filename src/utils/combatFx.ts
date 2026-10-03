/**
 * COMBATE — a arte e o ritmo das três ações visuais da cena de combate
 * (`components/games/BattleStage.tsx`, rodada 5 / I10, 02/10/2026).
 *
 * Cada lutador faz três coisas na cena, todas com a arte de SKILL do ELEMENTO
 * dele (`fx-<elemento>-<estado>.png`, `utils/attackFxArt.ts`):
 *  · **ataque físico (`melee`)** — investida corpo a corpo: o lutador corre até
 *    o alvo; no alvo aparecem o corte (`slash`) e o impacto (`impact`);
 *  · **ataque à distância (`ranged`)** — o projétil (`orb`) do elemento
 *    atravessa a cena; no alvo, o impacto; o conjurador solta o `cast`;
 *  · **escudo (`shield`)** — a defesa automática mostra a barreira do elemento
 *    do DEFENSOR (`defended`) no lugar do impacto.
 * O golpe ESPECIAL (`special`) é o ranged em dobro: `cast` + `aura` no
 * conjurador, `orb` maior e `impact` maior.
 *
 * Este arquivo só decide QUAL arte e QUANTO tempo; não desenha nada.
 * Nenhuma regra de jogo mora aqui (dano, gauge, golpe: `arena.ts`/`_duel.js`).
 */
import { attackFx, type AttackFxState } from './attackFxArt';
import type { EscolaId } from './soulProfile/ficha/types';

export type StageActionKind = 'melee' | 'ranged' | 'special';

/** Elemento sem arte própria cai neste (neutro tem os 6 estados). */
export const FX_FALLBACK_ELEMENT = 'neutro';

/** Os 17 elementos base (a mesma lista do anel de `arena.ts`), para dar um elemento visual ao oponente. */
export const VISUAL_ELEMENTS = [
  'fogo', 'vida', 'terra', 'gravidade', 'ar', 'som', 'eletricidade', 'agua',
  'marcial', 'arcano', 'tempo', 'espaco', 'luz', 'sombra', 'morte', 'vileza', 'vigor',
] as const;

/** Ids do oráculo que não existem como arte: o mais próximo (`attackFxArt` faz o mesmo para a aura). */
const ORACLE_TO_FX: Record<string, string> = { planta: 'vida', industrial: 'aco' };

/** Id de elemento (do oráculo, da ficha ou do bestiário) → id que tem arte; sem arte, `neutro`. */
export function fxElementId(id: string | undefined | null): string {
  if (!id) return FX_FALLBACK_ELEMENT;
  const mapped = ORACLE_TO_FX[id] ?? id;
  return attackFx(mapped, 'orb') ? mapped : FX_FALLBACK_ELEMENT;
}

/** A URL do estado para o elemento, caindo no `neutro`. Nunca `undefined` se o neutro estiver instalado. */
export function fxFrame(elementId: string | undefined | null, estado: AttackFxState): string | undefined {
  const id = fxElementId(elementId);
  return attackFx(id, estado) ?? attackFx(FX_FALLBACK_ELEMENT, estado);
}

/** O elemento do oponente do duelo (o servidor não publica elemento): determinístico pelo id dele. */
export function visualElementFor(seedText: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return VISUAL_ELEMENTS[h % VISUAL_ELEMENTS.length];
}

/** Escola da ficha → como o golpe básico aparece: só o combate físico investe; o resto atira. */
export function strikeKindForSchool(escola: EscolaId | undefined): 'melee' | 'ranged' {
  return escola === 'combate_fisico' ? 'melee' : 'ranged';
}

/**
 * Tempos da cena, em ms, no relógio do `BattleStage` (do início da ação até o
 * IMPACTO, e a duração total do efeito). O jogo aplica o dano (barra de HP,
 * número flutuante) no IMPACTO — a barra não cai antes de o golpe chegar.
 */
export const STAGE_TIMING = {
  melee: { impact: 460, total: 1000 },
  ranged: { impact: 760, total: 1250 },
  special: { impact: 980, total: 1500 },
  /** Movimento reduzido: sem trajeto, só a troca de pose/flash no alvo. */
  reduced: { impact: 120, total: 700 },
} as const;

export function impactMs(kind: StageActionKind, reduced: boolean): number {
  return (reduced ? STAGE_TIMING.reduced : STAGE_TIMING[kind]).impact;
}
export function totalMs(kind: StageActionKind, reduced: boolean): number {
  return (reduced ? STAGE_TIMING.reduced : STAGE_TIMING[kind]).total;
}

/**
 * Passo da luta do DUELO FANTASMA (Torneio): tempo entre o começo de um golpe e
 * o do seguinte. Era 900 ms (12 golpes ≈ 10,6 s); com 1500 ms a luta dura ~17,5 s
 * e o especial (gauge de 16 toques a ~3 toques/s) sai por volta dos 10 s tocando.
 * Calibração e taxa de vitória: `REGISTRO-DE-DECISOES.md` §20.9.
 */
export const DUEL_STEP_MS = 1500;

/**
 * Duelo da Arena: do começo do turno até o golpe do pet CHEGAR no alvo (era 1500 ms) e
 * do começo do revide até o inimigo CHEGAR no pet (era 800 ms). O gauge acumula entre
 * os turnos; um turno de um inimigo dura ~3,7 s, ~11 toques a 3 toques/s.
 */
export const ARENA_STRIKE_MS = 2400;
export const ARENA_DEFEND_MS = 1400;

/** `prefers-reduced-motion` (lido uma vez por cena): sem investida nem projétil, só o flash. */
export function prefersReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
