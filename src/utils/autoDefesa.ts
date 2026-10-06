/**
 * DEFESA AUTOMÁTICA — o pet se defende sozinho (TORC-3, dono, 02/10/2026).
 *
 * Antes, a esquiva era a única ação ativa do dono no Pesadelo, na Masmorra e no
 * Duelo da Arena: uma `TimingBar` ("Desviar!"). O dono tirou a torcida por
 * timing e, junto, a esquiva: agora o dono só TORCE (toques → gauge → golpe
 * especial) e o Soulmon se defende sozinho. Esta é a regra dessa defesa.
 *
 * Ela devolve uma PRECISÃO em 0..1 — exatamente o número que a `TimingBar`
 * entregava —, de modo que toda a conta de dano que já existia (linear em
 * `1 - acc`, esquiva limpa a partir de `perfeito`, contra-ataque) continua
 * valendo sem tocar em nenhuma fórmula de combate.
 *
 * Determinística: o sorteio vem de `defenseRoll(seed, n)` (a semente da run e o
 * número do golpe sofrido), nunca de `Math.random()` — mesma semente, mesma luta.
 * Os insumos são dados que o combate JÁ tem (o `jeito` da profissão na
 * Masmorra; na Arena, o elemento, que já entra em `enemyHitDamage`); não há
 * atributo novo.
 *
 * ## Calibração
 *
 * O jogador "médio" da barra era a convenção do balanceamento da Arena
 * (`accMean` 0,7 ± 0,25 uniforme, `utils/arena.ts`). A defesa automática mira o
 * MESMO jogador médio (`AUTO_DEF_MEAN`/`AUTO_DEF_SPREAD`; o level do pet já entra na luta pelo
 * `soulCombatant` e pela escada de inimigos relativa a ele, então a defesa não ganha um segundo degrau
 * por estágio), para que a taxa de vitória e a duração das
 * lutas fiquem onde estavam. A medição da defesa DENTRO da luta (Masmorra e Pesadelo no núcleo v3) está em
 * `dungeon.v3.test.ts` e `nightmares.v3.test.ts`; a conta histórica, em `docs/REGISTRO-DE-DECISOES.md` §20.
 *
 * ## A esquiva por timing
 *
 * `TIMING_DODGE_ENABLED = false` desliga a `TimingBar` de defesa nas três telas
 * (`DungeonGame`, `NightmareBattle`, `ArenaGame`). O código da barra e do ramo
 * antigo FICA atrás desta constante — reaproveitar em outro lugar depois.
 */
import type { JeitoNaMasmorra } from './profissaoMasmorra';

/** A esquiva por `TimingBar` está desligada (decisão do dono, 02/10/2026). */
export const TIMING_DODGE_ENABLED = false as boolean;

/** Precisão média da defesa — o jogador médio da barra (convenção da Arena). */
export const AUTO_DEF_MEAN = 0.7;
/** Meia-largura do sorteio uniforme em torno da média. */
export const AUTO_DEF_SPREAD = 0.25;
/** A partir daqui a defesa é perfeita: nenhum dano (+ contra-ataque na Masmorra). */
export const AUTO_DEF_PERFECT = 0.92;
/** A partir daqui o feedback diz "defendeu em parte". */
export const AUTO_DEF_PARTIAL = 0.6;

export type DefenseOutcome = 'esquiva' | 'parcial' | 'cheio';

export interface AutoDefenseOptions {
  /** Ajuste fino somado à média (o jeito da profissão, ver `jeitoDefesaBonus`). */
  bonus?: number;
  /** Limiar da esquiva perfeita (o `perfeito` do jeito; padrão `AUTO_DEF_PERFECT`). */
  perfect?: number;
}

export interface AutoDefenseResult {
  /** Precisão equivalente da barra, 0..1 — entra nas mesmas fórmulas de dano. */
  acc: number;
  outcome: DefenseOutcome;
}

/**
 * Sorteio determinístico 0..1 (mulberry32 sobre `seed + n·φ`). Puro: a mesma
 * (semente, n) devolve sempre o mesmo número.
 */
export function defenseRoll(seed: number, n: number): number {
  let a = ((Math.floor(seed) | 0) + Math.imul(Math.floor(n) | 0, 0x9e3779b1)) | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** `roll` ∈ [0,1): a defesa deste golpe sofrido. Pura. */
export function autoDefense(roll: number, opts: AutoDefenseOptions = {}): AutoDefenseResult {
  const r = Number.isFinite(roll) ? Math.min(1, Math.max(0, roll)) : 0.5;
  const raw = AUTO_DEF_MEAN + (opts.bonus ?? 0) + (r * 2 - 1) * AUTO_DEF_SPREAD;
  const acc = Math.min(1, Math.max(0, raw));
  const perfect = opts.perfect ?? AUTO_DEF_PERFECT;
  const outcome: DefenseOutcome = acc >= perfect ? 'esquiva' : acc >= AUTO_DEF_PARTIAL ? 'parcial' : 'cheio';
  return { acc, outcome };
}

/**
 * O que o `jeito` da profissão dava na barra de desvio vira bônus na defesa
 * automática: barra mais lenta (`velocidadeDefesa` < 1) e tempo extra para
 * reagir (`tempoDefesaExtra`) tornam-se precisão a mais. Ofício sem nada disso
 * devolve 0 — a Masmorra de sempre.
 */
export function jeitoDefesaBonus(jeito: Pick<JeitoNaMasmorra, 'velocidadeDefesa' | 'tempoDefesaExtra'>): number {
  return (1 - jeito.velocidadeDefesa) * 0.5 + jeito.tempoDefesaExtra * 0.1;
}

/** Semente nova para uma run (a defesa é determinística DENTRO dela). */
export function newDefenseSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}
