import { getStageLevel } from '../types/progression';

/**
 * TROCA LATERAL DE FORMA (05/11/2026, decisão do dono) — dona única da regra.
 *
 * Quem já desbloqueou mais de uma forma do MESMO nível (ex.: `champion-power`
 * e `champion-harmony`) pode alternar entre elas, de graça e sem limite. Não é
 * queda: o nível não muda, então nada do que a queda cobra se aplica.
 *
 * Antes, o botão "Degenerar" aparecia nesse caso e `handleDegenerate` enchia o
 * HP e passava por `degeneratedPerfectDays`/`degeneratedEvolutionPoints`, cujo
 * piso pode até AUMENTAR pontos. Agora a troca lateral muda SÓ `evolutionStage`:
 * HP, `perfectDays` e `evolutionPoints` ficam como estão, e
 * `attributesSinceLastEvolution`/`chipsStage` também — a contagem é "por
 * estágio" (nível), e o nível é o mesmo; zerá-los daria de brinde chips novos
 * a cada troca. `currentBranch` (o galho dominante dos hábitos) não é tocado.
 */

/** O alvo é uma forma diferente, do mesmo nível do atual, e já desbloqueada? */
export function canSwitchLaterally(input: {
  currentStageId: string;
  targetStageId: string;
  unlockedEvolutions?: readonly string[];
}): boolean {
  const { currentStageId, targetStageId } = input;
  if (typeof currentStageId !== 'string' || typeof targetStageId !== 'string') return false;
  if (currentStageId === targetStageId) return false;
  const level = getStageLevel(currentStageId);
  // rookie e ultra são forma única: não há "ao lado".
  if (level === 'rookie' || level === 'ultra') return false;
  if (getStageLevel(targetStageId) !== level) return false;
  return (input.unlockedEvolutions ?? []).includes(targetStageId);
}

/** Troca lateral pura: só `evolutionStage` muda. Alvo inválido devolve o mesmo objeto. */
export function applyLateralSwitch<T extends { evolutionStage: string; unlockedEvolutions?: string[] }>(
  prev: T,
  targetStageId: string,
): T {
  if (!canSwitchLaterally({
    currentStageId: prev.evolutionStage,
    targetStageId,
    unlockedEvolutions: prev.unlockedEvolutions,
  })) return prev;
  return { ...prev, evolutionStage: targetStageId };
}
