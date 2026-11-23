// ---------------------------------------------------------------------------
// ARENA LIVRE: SORTEIO GERAL + REROLL (decisão do dono, 28/10/2026 — revoga a "Arena por tema" de 27/10).
//
// Dono único de:
//   1. `arenaFoesOfSeed(seed, rodada)` — a ÚNICA função pura que diz quem é o inimigo de uma rodada da run `seed`. O card da `DueloSheet`
//      e a `ArenaGame.montarRodada` chamam esta mesma, então o card mostra EXATAMENTE o que será lutado. Sem tema: sorteio geral: metade das runs usa o pool BASE
//      (20 elementos, 1 criatura por elemento) e metade o pool COMBINADO (rookies de 2 elementos; `isComboSeed`).
//   2. `arenaCards(...)` — os `ARENA_CHOICES` (4) cards do dia, determinísticos por (dia do jogador, conta, nº de rerolls): fechar e
//      reabrir mostra os mesmos; cada reroll mistura o contador na semente. Elementos DISTINTOS entre os cards quando der (re-sorteio
//      vizinho), no máximo 1 Desgarrado (`arenaCardSeeds`). O sorteio é por PREFIXO: os N primeiros cards de um tamanho maior são os
//      mesmos do tamanho N (§370: o 4º card entrou por último e os 3 de antes de 14/11/2026 não mudaram).
//   3. A tabela de CUSTO do reroll: 3 grátis POR HORA (UTC; decisão do dono 22/11/2026, revoga §180 "3 por dia"); do 4º na mesma hora em diante só Bits (15, 30, 45 e 45 fixo). Nunca Crédito/Emblema.
//   4. `arenaSceneOfSeed(seed)` — o cenário da run: sempre uma das duas arenas do Torneio, fixa durante a run (escolhida pela semente).
// ---------------------------------------------------------------------------
import { ARENA_ROUNDS, arenaLadderStage, buildArenaRound, type ArenaEnemy } from './arena';
import { NOVOS_DATA } from './novosSoulmonData';
import { mulberry32 } from './combate/rng';
import { arenaCardSeeds, isStraySeed } from './strayFoes';
import { ARENA_REROLL_FREE_PER_HOUR, ARENA_REROLL_PRICES, ARENA_REROLL_MAX_COUNT, arenaHourKey, arenaRerollCost, arenaRerollsFreeLeft, sanitizeArenaReroll, arenaRerollsToday, arenaRerollsThisHour, nextArenaReroll, applyArenaReroll, applyArenaRunEnd, type ArenaReroll } from './arenaReroll';
export { ARENA_REROLL_FREE_PER_HOUR, ARENA_REROLL_PRICES, ARENA_REROLL_MAX_COUNT, arenaHourKey, arenaRerollCost, arenaRerollsFreeLeft, sanitizeArenaReroll, arenaRerollsToday, arenaRerollsThisHour, nextArenaReroll, applyArenaReroll, applyArenaRunEnd, type ArenaReroll };
import { ARENA_BG_SCENES, type DungeonScene } from './dungeonScenes';

/**
 * §370 (dono, 14/11/2026: "Aumente as opções de tipo da arena para 4 ao invés de 3"): quantos desafios a Arena livre oferece para o
 * jogador escolher 1. Dono ÚNICO do número: o sorteio (`arenaCards`), a folha (`DueloSheet`) e o guia (`GuideModal`) leem daqui.
 * Era 3 até 14/11/2026. Mudar só ACRESCENTA ou TIRA cards do fim: o sorteio é por prefixo, então os primeiros não mudam.
 */
export const ARENA_CHOICES = 4;

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h | 0;
}

/** §199: os elementos BASE que têm criatura (o pool das runs comuns e Desgarradas). */
export const ARENA_BASE_ELEMENTS: readonly string[] = [...new Set(NOVOS_DATA.map(n => n.element))].sort();
const RUN_ELEMENT_MIX = 0x3e1e3e17;

/**
 * §199 (emenda do dono, 30/10/2026): o elemento BASE da run `seed` — o que o card mostra e o de todo inimigo das 5 rodadas (com uma chance
 * pequena, `ARENA_FUSED_FOE_CHANCE`, de um inimigo ser um fundido que CONTÉM esse elemento). Fundido não entra no sorteio do elemento.
 */
export function arenaRunElement(seed: number): string {
  return ARENA_BASE_ELEMENTS[Math.floor(mulberry32((seed ^ RUN_ELEMENT_MIX) | 0)() * ARENA_BASE_ELEMENTS.length)];
}

/** Os inimigos da rodada `rodada` (1-based) da run `seed`. Pura: card e luta chamam ESTA. */
export function arenaFoesOfSeed(seed: number, rodada: number, ladder = 0, playerLevel?: number): ArenaEnemy[] {
  return buildArenaRound(rodada, 1, mulberry32((seed ^ Math.imul(rodada, 0x9e3779b1)) | 0), undefined, isStraySeed(seed), false, arenaRunElement(seed), ladder, playerLevel); // §199 emenda: o fundido vem pela chance por inimigo, não pela run
}

/** §222: a run desta semente MOSTRA Desgarrado? Só depois que a escada leva a última rodada a Ultimate; antes, a semente é uma run comum. */
export const arenaRunIsStray = (seed: number, ladder = 0): boolean => isStraySeed(seed) && arenaLadderStage(ladder, ARENA_ROUNDS) === 'ultimate';

/** O elemento que o card MOSTRA: o BASE da run. */
export const arenaCardElements = (seed: number): string[] => [arenaRunElement(seed)];

/**
 * Os `n` cards (`ARENA_CHOICES` por padrão). `accountKey` = saveId (ou outro identificador estável da conta). Elementos distintos entre os cards: se um card repete
 * elemento de outro, tenta a semente vizinha (até 64 vezes); sem saída, aceita o melhor (nunca trava).
 */
export function arenaCards(dayIso: string, accountKey: string, rerollCount: number, n = ARENA_CHOICES, runsDone = 0): number[] {
  // 04/11/2026 (dono): ao TERMINAR uma run (vitória, derrota ou empate) os cards são sorteados de novo, de graça — o nº de runs
  // terminadas no dia (`arenaRuns`) entra na semente. 0 runs = a semente de sempre (mesmos cards de antes da regra).
  const runs = Math.max(0, Math.floor(runsDone) || 0);
  const rng = mulberry32(hash(`${dayIso}|${accountKey}|${Math.max(0, Math.floor(rerollCount) || 0)}${runs > 0 ? `|run${runs}` : ''}`));
  const seeds = arenaCardSeeds(() => (rng() * 0x100000000) | 0, n);
  const taken = new Set<string>();
  return seeds.map(s0 => {
    let s = s0;
    for (let i = 0; i < 64; i++) {
      const els = arenaCardElements(s);
      if (els.every(e => !taken.has(e))) break;
      s = (s + 1) | 0;
      if (isStraySeed(s) !== isStraySeed(s0)) s = (s + 1) | 0; // vizinha do mesmo tipo (mantém o limite de 1 Desgarrado)
    }
    arenaCardElements(s).forEach(e => taken.add(e));
    return s;
  });
}

/** O cenário da run: uma das duas arenas do Torneio, escolhida pela semente e FIXA durante a run (todas as rodadas e visores). */
export function arenaSceneOfSeed(seed: number): DungeonScene {
  return ARENA_BG_SCENES[Math.abs(Math.imul(seed | 0, 0x9e3779b1) >>> 7) % ARENA_BG_SCENES.length];
}
