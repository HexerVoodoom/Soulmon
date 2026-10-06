import { useMemo } from 'react';
import { useGameStateOptional } from './GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { talentBonus, talentAttrBonus, talentCheerScale } from '../utils/talents';
import { combinedBonus, combinedAttrBonus, NO_ATTR_BONUS, type AttrBonus } from '../utils/combate/bonus';

/**
 * Combate v3 / PR7 — o bônus de talento do jogador na FENDA (PvE: Arena, Masmorra, Pesadelo), JÁ PELO CANAL ÚNICO
 * (`combinedBonus`, teto de 5% somando todas as fontes). Sem provider (demo, testes) vale 0. Equipamento/Comércio/Renascimento
 * entram aqui quando existirem (PR8): ninguém soma fonte por conta própria. O PvP tem o seu canal por atributo: `usePvpTalents`.
 */
export function useTalentBonus(scope: 'pve'): number {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  return useMemo(() => combinedBonus({ talent: talentBonus(picks, bondLevelFor(xp ?? 0), scope) }), [picks, xp, scope]);
}

export interface PvpTalents {
  /** ATK/DEF/SPD distintos; a SOMA dos três nunca passa de 5% (`combinedAttrBonus`). */
  readonly bonus: AttrBonus;
  /** Rendimento da torcida do Duelo (1 sem o nó `tal-pvp-05`). */
  readonly cheerScale: number;
}

/** PR7b — o que o talento dá no Duelo (e no treino), o MESMO que o servidor aplica (`_duel.js › duelSide`). Sem provider vale 0 / 1. */
export function usePvpTalents(): PvpTalents {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  return useMemo(() => {
    const bond = bondLevelFor(xp ?? 0);
    return { bonus: combinedAttrBonus({ talent: talentAttrBonus(picks, bond) }), cheerScale: talentCheerScale(picks, bond) };
  }, [picks, xp]);
}

export { NO_ATTR_BONUS };
