// ---------------------------------------------------------------------------
// COERÊNCIA ESTÁGIO × HP DO INIMIGO (dono, 11/11/2026: "na 5ª luta da Arena o inimigo tinha ~2.500 de HP e aparecia Champion").
// REGRA ÚNICA do PvP/PvE de inimigo sorteado (Arena, Masmorra e afins): a forma EXIBIDA nunca fica abaixo da faixa do HP que o inimigo
// realmente tem. Antes o HP vinha do level do JOGADOR (`arenaFoe`/`dungeonFoe`) e a forma vinha da escada/tier, sem se olharem.
// As faixas NÃO são chute: saem do HP real de cada estágio (`autoHp`, pontos exibidos): rookie 330–480, champion 765–1035,
// ultimate 1620–2093, mega 3240–4050, ultra 6227–7594. O piso de cada estágio é o ponto médio entre o teto do anterior e o piso dele
// (≈ 622 / 1.327 / 2.666 / 5.138). Dá para só SUBIR a forma (nunca descer): quem tem arte abaixo do pedido cai para a anterior, como já era.
// ---------------------------------------------------------------------------
import { hpPoints } from './combate/fight';
import { STAGE_LEVEL_CAPS, autoHp } from './combate/level';

export type FoeStage = 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra';
export const FOE_STAGES: readonly FoeStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];

/** Piso de HP (pontos exibidos) de champion, ultimate, mega e ultra: o meio entre o último level do estágio de baixo e o primeiro do de cima. */
export const FOE_STAGE_HP_FLOORS: readonly number[] = [1, 2, 3, 4].map(s => (hpPoints(autoHp(STAGE_LEVEL_CAPS[s - 1])) + hpPoints(autoHp(STAGE_LEVEL_CAPS[s - 1] + 1))) / 2);

/** A menor forma coerente com o HP de NÚCLEO `coreHp` (a conversão para pontos exibidos é interna). */
export function stageForFoeHp(coreHp: number): FoeStage {
  const pts = hpPoints(coreHp);
  let i = 0;
  while (i < FOE_STAGE_HP_FLOORS.length && pts >= FOE_STAGE_HP_FLOORS[i]) i++;
  return FOE_STAGES[i];
}

/** A maior das duas formas. */
export const maxFoeStage = <T extends FoeStage>(a: T, b: T): T => (FOE_STAGES.indexOf(a) >= FOE_STAGES.indexOf(b) ? a : b);
