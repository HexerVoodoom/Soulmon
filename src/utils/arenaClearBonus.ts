// ---------------------------------------------------------------------------
// BÔNUS DE "TODOS DERROTADOS" NA ARENA (decisão do dono, 14/11/2026, REGISTRO §372).
//
// Pedido: "Derrotar todos na Arena concede bônus no prêmio". O levantamento recomendava +50% de Bits; o dono escolheu
// "+1 material ou essência". A run já paga essência a CADA rodada (`essenceDropsOfFoe`), então o bônus é +1 MATERIAL:
// a Presa (`fang`), o material do próprio prédio do Duelo (`MATERIAL_BUILDING.fang = 'arena.duelo'`).
//
// Regras (dono único; funções PURAS, `day` por parâmetro):
//   - só quando a run TERMINA VENCIDA (as `ARENA_ROUNDS` rodadas, todos os inimigos derrotados); derrota/empate não pagam;
//   - NÃO é Bit: não passa pelo funil de Bits nem conta no teto `MINIGAME_BITS_PER_DAY` (150);
//   - NÃO é Honra: "a Arena não paga Honra" (REGISTRO l.2579, §280) continua valendo;
//   - anti-farm: a Arena não tem limite de runs, e material é o ritmo do Soulsmith (`forge.tempo.test.ts` conta ~1 por dia por
//     prédio). Por isso o bônus vale UMA vez por dia do jogador (`ARENA_CLEAR_BONUS_PER_DAY`): só na 1ª run vencida do dia.
//     O contador é o que o jogo JÁ grava — `dailyMissions.counts.arena` (o evento 'arena' sobe 1 por run vencida, no mesmo
//     gesto que credita os Bits). Nenhum campo novo no save;
//   - estoque no teto (`MATERIAL_CAP` = 99): não paga e não mostra a linha (nada de "+1" que não entrou).
// ---------------------------------------------------------------------------

import { MATERIAL_CAP, forDay as buildingForDay, type BuildingQuestState, type MaterialId } from './buildingQuests';
import { dailyForDay, type DailyMissionsState } from './dailyMissions';

/** O material do bônus: a Presa, o material do Duelo. */
export const ARENA_CLEAR_BONUS_MATERIAL: MaterialId = 'fang';
/** Quanto o bônus paga. */
export const ARENA_CLEAR_BONUS_QTY = 1;
/** Quantas runs vencidas por dia do jogador recebem o bônus. */
export const ARENA_CLEAR_BONUS_PER_DAY = 1;

export interface ArenaClearBonusState {
  dailyMissions?: DailyMissionsState;
  buildingQuests?: BuildingQuestState;
}

/**
 * Quanto do material o bônus paga AGORA (0 ou `ARENA_CLEAR_BONUS_QTY`). Lido ANTES de o evento 'arena' desta vitória entrar
 * na contagem do dia: `counts.arena` = runs vencidas antes desta.
 */
export function arenaClearBonusDue(s: ArenaClearBonusState, day: string): number {
  const vitoriasAntes = dailyForDay(s.dailyMissions, day).counts.arena ?? 0;
  if (vitoriasAntes >= ARENA_CLEAR_BONUS_PER_DAY) return 0;
  const had = buildingForDay(s.buildingQuests, day).materials[ARENA_CLEAR_BONUS_MATERIAL] ?? 0;
  return Math.max(0, Math.min(ARENA_CLEAR_BONUS_QTY, MATERIAL_CAP - had));
}

/** Paga o bônus sobre o `prev` do updater. Nada a pagar devolve o MESMO `prev` (e `paid: 0`). */
export function applyArenaClearBonus<T extends ArenaClearBonusState>(prev: T, day: string): { state: T; paid: number } {
  const paid = arenaClearBonusDue(prev, day);
  if (paid <= 0) return { state: prev, paid: 0 };
  const bq = buildingForDay(prev.buildingQuests, day);
  const had = bq.materials[ARENA_CLEAR_BONUS_MATERIAL] ?? 0;
  return {
    state: { ...prev, buildingQuests: { ...bq, materials: { ...bq.materials, [ARENA_CLEAR_BONUS_MATERIAL]: Math.min(MATERIAL_CAP, had + paid) } } },
    paid,
  };
}
