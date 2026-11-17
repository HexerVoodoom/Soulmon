// 🌀 OS CONJUNTOS DE ANDARES DO RIFT INFINITO (pedido do dono, 16/11/2026 — REGISTRO §445).
//
// DONO ÚNICO do mapeamento PROFUNDIDADE → CONJUNTO → (elemento, nº de elementos base, estágio dos comuns, estágio do mini-boss, é mini-boss?).
// PURO: sem arte, sem roster, sem relógio, sem `Math.random`. A tela (`DungeonGame`), a conta de quem ficou fora (`dungeonAway.ts`) e os
// testes leem o MESMO `riftWavePlan`; o servidor não monta onda (só valida o save), então não há espelho a manter.
//
// A ORDEM dos conjuntos já era a da masmorra temática (`dungeonElementos.ts`, 08/11/2026): cada elemento ocupa `CAMADAS_POR_ELEMENTO` (2)
// andares seguidos = 1 CONJUNTO; primeiro os 20 base, depois os 190 pares, os 40 trios e os 19 quádruplos (269 conjuntos = 538 andares;
// depois disso volta ao começo, com a dificuldade de profundidade seguindo a subir). Este módulo NÃO repete essa lista: lê dela.
//
// O QUE É NOVO aqui (e substitui, no Rift/Masmorra idle, os degraus 60/200/500 de `dificuldadeEstagio.ts`, REGISTRO §437):
//   · o ESTÁGIO dos inimigos vem do nº de elementos base do conjunto — comuns e mini-boss (`RIFT_STAGE_BY_COUNT`);
//   · o ÚLTIMO combate do conjunto (a 6ª luta do 2º andar) é o MINI-BOSS: um estágio acima dos comuns e `RIFT_MINIBOSS_EXTRA_FLOORS`
//     andares de crescimento a mais (a conta de `DUNGEON_FLOOR_GROWTH`, a mesma de sempre);
//   · soft lock é ACEITO e DESEJADO: a força segue `dungeonFoe` e cresce com a profundidade; ninguém a abranda para o jogador passar.
//
// GANCHO DO ULTRA: o mini-boss dos conjuntos de 4 elementos deveria ser ULTRA. O roster de inimigos ainda não tem Ultra de combinado
// (`ENEMY_STAGES` para no Mega) e a arte não se inventa: hoje esse mini-boss é o Mega do elemento, com a força de mini-boss, e
// `miniBossUltra` fica `true` no plano. Quando houver arte Ultra, basta trocar `RIFT_STAGE_BY_COUNT[4].boss` para 'ultra' e adicionar o
// estágio ao roster — o resto (HUD, plano, testes) já distingue o caso.
import type { EnemyStage } from './enemyRoster';
import { CAMADAS_POR_ELEMENTO, ELEMENTOS_DA_MASMORRA, componentesDoElemento, elementoDaCamada } from './dungeonElementos';
import { DUNGEON_FIGHTS_PER_FLOOR } from './dungeonIdle';

export type RiftCount = 1 | 2 | 3 | 4;

/** Estágio dos inimigos COMUNS e do MINI-BOSS por nº de elementos base do conjunto (decisão do dono, 16/11/2026). */
export const RIFT_STAGE_BY_COUNT: Readonly<Record<RiftCount, { readonly common: EnemyStage; readonly boss: EnemyStage }>> = {
  1: { common: 'rookie', boss: 'champion' },
  2: { common: 'champion', boss: 'ultimate' },
  3: { common: 'ultimate', boss: 'mega' },
  4: { common: 'mega', boss: 'mega' }, // mini-boss de 4 elementos = ULTRA quando houver arte (ver o cabeçalho); hoje, o Mega
};

/** Nº de elementos cujo mini-boss deveria ser Ultra (gancho: o roster ainda não tem Ultra de combinado). */
export const RIFT_ULTRA_COUNT: RiftCount = 4;

/** Andares de crescimento a mais do mini-boss: ele luta como se o andar fosse 1 acima (`DUNGEON_FLOOR_GROWTH`: HP × +14%, força × +16%). Derivado do que já existe, sem número novo de balanço. */
export const RIFT_MINIBOSS_EXTRA_FLOORS = 1;

/** O lugar do mini-boss na escada de um andar: a última luta (`DUNGEON_FIGHTS_PER_FLOOR − 1`). */
export const RIFT_MINIBOSS_SLOT = DUNGEON_FIGHTS_PER_FLOOR - 1;

/** Quantos conjuntos existem antes de a lista dar a volta. */
export const RIFT_SET_COUNT = ELEMENTOS_DA_MASMORRA.length;

export interface RiftSet {
  /** 0-based, já dentro do ciclo (dá a volta no fim da lista). */
  index: number;
  /** O elemento do conjunto (id do catálogo). */
  element: string;
  /** Nº de elementos base: 1 (base), 2 (par), 3 (trio) ou 4. */
  count: RiftCount;
  /** 1 ou 2: qual andar do conjunto é este. */
  part: number;
}

const int = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1);

const countOf = (element: string): RiftCount => Math.min(4, Math.max(1, componentesDoElemento(element) ?? 1)) as RiftCount;

/** O conjunto a que o andar `layer` (1-based) pertence. Entrada ruim cai no andar 1. */
export function riftSetOfLayer(layer: number): RiftSet {
  const l = int(layer);
  const element = elementoDaCamada(l);
  return {
    index: Math.floor((l - 1) / CAMADAS_POR_ELEMENTO) % RIFT_SET_COUNT,
    element,
    count: countOf(element),
    part: ((l - 1) % CAMADAS_POR_ELEMENTO) + 1,
  };
}

/** O andar `layer` é o ÚLTIMO do conjunto (o que termina no mini-boss)? */
export const isMiniBossLayer = (layer: number): boolean => riftSetOfLayer(layer).part === CAMADAS_POR_ELEMENTO;

/** A luta `slot` (0-based) do andar `layer` é o MINI-BOSS? */
export const isMiniBossFight = (layer: number, slot: number): boolean => isMiniBossLayer(layer) && Math.floor(slot) === RIFT_MINIBOSS_SLOT;

export interface RiftWavePlan {
  set: RiftSet;
  /** Estágio de arte dos inimigos comuns. */
  comum: EnemyStage;
  /** Estágio do mini-boss; presente só no último andar do conjunto (é a última luta dele). */
  miniBoss?: EnemyStage;
  /** O mini-boss deste conjunto é de 4 elementos: o Ultra ainda não existe, o Mega faz o papel (gancho). */
  miniBossUltra: boolean;
}

/** O plano da onda de um andar: o que `buildDungeonWave` precisa saber do conjunto. */
export function riftWavePlan(layer: number): RiftWavePlan {
  const set = riftSetOfLayer(layer);
  const st = RIFT_STAGE_BY_COUNT[set.count];
  const fim = set.part === CAMADAS_POR_ELEMENTO;
  return { set, comum: st.common, ...(fim ? { miniBoss: st.boss } : {}), miniBossUltra: fim && set.count === RIFT_ULTRA_COUNT };
}

/** O NOME do andar dentro do conjunto: "Fogo 1" (1º andar) e "Fogo 2" (2º); vencidas as 6 lutas do 1, desce-se ao 2 (pedido do dono, 16/11/2026). */
export const riftFloorName = (elementName: string, part: number): string => `${elementName} ${Math.min(CAMADAS_POR_ELEMENTO, int(part))}`;

/** O nome do CONJUNTO inteiro no mapa, onde um nó vale os dois andares: "Fogo 1 e 2" / "Fire 1 & 2". */
export const riftSetName = (elementName: string, isPt: boolean): string => `${elementName} 1 ${isPt ? 'e' : '&'} ${CAMADAS_POR_ELEMENTO}`;
