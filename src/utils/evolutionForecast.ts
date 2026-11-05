import { getStageLevel } from '../types/progression';
import type { EvolutionStage } from '../types/progression';

/**
 * ORDEM DOS NÍVEIS e o "previsto" do grafo de evolução — dono único (05/11/2026).
 *
 * O nó "previsto" é SEMPRE o do nível seguinte ao atual, no galho previsto.
 * Antes era "o primeiro nó do galho ainda não desbloqueado": quem evoluiu por
 * galhos trocados (Champion de Benevolência, depois Ultimate de Poder, já Mega)
 * via o previsto cair num nível igual ou abaixo do atual (Ultimate de
 * Benevolência), porque só o Champion daquele galho estava desbloqueado.
 */
const NIVEIS: readonly EvolutionStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];

export function stageLevelIndex(stageId: string): number {
  return NIVEIS.indexOf(getStageLevel(stageId));
}

/** Id do nó previsto dentre os do galho: o de nível = nível atual + 1; `null` se não houver. */
export function forecastNodeId(currentStageId: string, branchNodeIds: readonly string[]): string | null {
  const alvo = stageLevelIndex(currentStageId) + 1;
  return branchNodeIds.find(id => stageLevelIndex(id) === alvo) ?? null;
}
