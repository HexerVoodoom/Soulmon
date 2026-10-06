import { useMemo } from 'react';
import { useGameStateOptional } from './GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { talentBonus } from '../utils/talents';
import { combinedBonus } from '../utils/combate/bonus';

/**
 * Combate v3 / PR7 — o bônus de talento do jogador para um `scope`, JÁ PELO CANAL ÚNICO (`combinedBonus`, teto de
 * 5% somando todas as fontes). Sem provider (demo, testes) vale 0. Equipamento/Comércio/Renascimento entram aqui
 * quando existirem (PR8): ninguém soma fonte por conta própria.
 */
export function useTalentBonus(scope: 'pvp' | 'pve'): number {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  return useMemo(() => combinedBonus({ talent: talentBonus(picks, bondLevelFor(xp ?? 0), scope) }), [picks, xp, scope]);
}
