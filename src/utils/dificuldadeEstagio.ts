/**
 * REGRA DE DIFICULDADE POR ESTÁGIO (dono, 16/11/2026, REGISTRO §232 usado como peso do sorteio de INIMIGOS) — dono único.
 *
 * Quanto mais difícil/avançado o modo (profundidade da Masmorra/Rift, escada da Arena, Match-3), mais alto o ESTÁGIO do inimigo, e
 * cada estágio tem a sua mistura de elementos: a tabela `CHANCES_POR_ESTAGIO` (`elementoCombinado.ts`: % de 1/2/3/4 componentes)
 * é o PESO do sorteio. Este módulo só tem as peças puras (sem roster): o sorteio que as junta mora em `enemyRoster.ts`
 * (`pickEnemy({ tabela: true })`), para não criar ciclo de import.
 *
 * CÉLULA = (estágio × nº de componentes do elemento). O sorteio:
 *   1. `sortearContagem(estágio, u)`: UM número `u` ∈ [0,1) cai numa faixa da linha do estágio e devolve também `frac` (a posição
 *      DENTRO da faixa, de novo uniforme em [0,1)), que escolhe a criatura. Continua UMA chamada de `rng` por inimigo (card = luta).
 *   2. Célula vazia no pool do estágio (o roster é pobre em combinados nos estágios altos): `celulaMaisProxima` troca pelo vizinho
 *      mais próximo que tenha criatura; empate: o de MENOS elementos (cair para o mais simples, nunca para um mais complexo que a
 *      tabela não pediu). Nunca falha enquanto o estágio tiver ao menos uma criatura.
 *
 * CURVA DE PROFUNDIDADE (Masmorra/Rift): o slot da escada pede um estágio; o ANDAR (`floor` = andar efetivo do núcleo de combate)
 * o desloca para cima em degraus (`PROFUNDIDADE_DEGRAUS`: 60, 200 e 500 → +1, +2, +3). O teto continua sendo o estágio liberado
 * pelo LEVEL do jogador (`ENEMY_STAGE_UNLOCK_LEVEL`: champion 7, ultimate 14, mega 22) e o Mega (o roster não tem Ultra).
 */
import { CHANCES_POR_ESTAGIO } from './elementoCombinado';
import { curatedComponents } from './elementosCurados';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import type { EnemyStage, RosterEntry } from './enemyRoster';

export type Contagem = 1 | 2 | 3 | 4;
export const CONTAGENS: readonly Contagem[] = [1, 2, 3, 4];

const ORDEM: readonly EnemyStage[] = ['rookie', 'champion', 'ultimate', 'mega'];

/** Quantos componentes tem o elemento da entrada (base/ramo = 1; fundido = o tamanho do par/curado; limitado a 1..4). */
export function contagemDaEntrada(e: Pick<RosterEntry, 'element' | 'elements'>): Contagem {
  const n = (curatedComponents(e.element) ?? DERIVED_ELEMENT_PAIRS.find(d => d.id === e.element)?.componentes ?? e.elements).length;
  return Math.min(4, Math.max(1, n)) as Contagem;
}

/** A linha da tabela §232 do estágio (% de 1/2/3/4 componentes). */
export const chancesDoEstagio = (stage: EnemyStage): readonly [number, number, number, number] => CHANCES_POR_ESTAGIO[stage];

/**
 * Sorteia o nº de componentes pela linha do estágio. `u` fora de [0,1) é preso. `frac` = posição dentro da faixa sorteada (uniforme
 * em [0,1)): quem chama usa para escolher a criatura sem gastar outro `rng`. Faixa de 0% nunca sai.
 */
export function sortearContagem(stage: EnemyStage, u: number): { k: Contagem; frac: number } {
  const w = chancesDoEstagio(stage);
  const total = w[0] + w[1] + w[2] + w[3];
  const x = Math.min(Math.max(Number.isFinite(u) ? u : 0, 0), 1 - 1e-12) * total;
  let lo = 0;
  for (let i = 0; i < 4; i++) {
    if (w[i] <= 0) continue;
    if (x < lo + w[i]) return { k: CONTAGENS[i], frac: (x - lo) / w[i] };
    lo += w[i];
  }
  return { k: 1, frac: 0 };
}

/** A célula mais próxima de `want` entre as `disponiveis` (empate: a de MENOS elementos). `undefined` = nenhuma disponível. */
export function celulaMaisProxima(want: Contagem, disponiveis: ReadonlySet<Contagem>): Contagem | undefined {
  if (disponiveis.has(want)) return want;
  return [...disponiveis].sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || a - b)[0];
}

/** Agrupa as entradas pela contagem de componentes. */
export function agruparPorContagem<T extends Pick<RosterEntry, 'element' | 'elements'>>(pool: readonly T[]): Map<Contagem, T[]> {
  const out = new Map<Contagem, T[]>();
  for (const e of pool) {
    const k = contagemDaEntrada(e);
    const l = out.get(k);
    if (l) l.push(e); else out.set(k, [e]);
  }
  return out;
}

/**
 * Escolhe a célula (contagem) para o `u`: sorteia pela tabela do estágio e relaxa para o vizinho mais próximo com criatura.
 * `undefined` só com o pool inteiro vazio (quem chama cai no caminho antigo).
 */
export function escolherCelula<T extends Pick<RosterEntry, 'element' | 'elements'>>(
  pool: readonly T[], stage: EnemyStage, u: number,
): { k: Contagem; querido: Contagem; lista: readonly T[]; frac: number } | undefined {
  const cells = agruparPorContagem(pool);
  const { k: querido, frac } = sortearContagem(stage, u);
  const k = celulaMaisProxima(querido, new Set(cells.keys()));
  return k === undefined ? undefined : { k, querido, lista: cells.get(k)!, frac };
}

/** Degraus de profundidade (andar efetivo) em que o estágio pedido pelo slot sobe 1. */
export const PROFUNDIDADE_DEGRAUS: readonly number[] = [60, 200, 500];

/** Quantos degraus de estágio o andar já deslocou (0..3). */
export function degrausDeProfundidade(floor: number): number {
  const f = Number.isFinite(floor) ? floor : 1;
  return PROFUNDIDADE_DEGRAUS.filter(t => f >= t).length;
}

/**
 * O estágio de um slot da escada no andar `floor`: sobe `degrausDeProfundidade` degraus, preso ao teto `maxPorLevel` (o maior estágio
 * liberado pelo level do jogador). Nunca desce abaixo do estágio do slot, mesmo que o level seja baixo.
 */
export function estagioPorProfundidade(slotStage: EnemyStage, floor: number, maxPorLevel: EnemyStage): EnemyStage {
  const i = ORDEM.indexOf(slotStage);
  const alvo = Math.min(ORDEM.length - 1, i + degrausDeProfundidade(floor), Math.max(i, ORDEM.indexOf(maxPorLevel)));
  return ORDEM[alvo];
}
