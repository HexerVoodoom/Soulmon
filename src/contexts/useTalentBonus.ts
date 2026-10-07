import { useMemo } from 'react';
import { useGameStateOptional } from './GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { talentBonus, talentAttrBonus, talentCheerScale, talentStartEnergy, talentDotResist, talentHealBoost, talentRiftBits, talentStartShield } from '../utils/talents';
import { dungeonAttrBonus, equipAttrBonus, equipScalar } from '../utils/equipment';
import { combinedBonus, combinedAttrBonus, NO_ATTR_BONUS, type AttrBonus } from '../utils/combate/bonus';

/**
 * Combate v3 / PR7 — o bônus de talento do jogador na FENDA (PvE: Arena, Masmorra, Pesadelo), JÁ PELO CANAL ÚNICO
 * (`combinedBonus`, teto de 5% somando todas as fontes). Sem provider (demo, testes) vale 0. Equipamento/Comércio/Renascimento
 * entram aqui quando existirem (PR8): ninguém soma fonte por conta própria. O PvP tem o seu canal por atributo: `usePvpTalents`.
 */
export function useTalentBonus(scope: 'pve' | 'nightmare'): number {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  const equipment = ctx?.gameState.equipment;
  // PR8: o equipamento entra aqui (a soma dos três slots), pelo MESMO canal e no MESMO teto de 5% do talento.
  return useMemo(() => combinedBonus({ talent: talentBonus(picks, bondLevelFor(xp ?? 0), scope), equipment: equipScalar(equipment) }), [picks, xp, scope, equipment]);
}

/** PR12a (§2.28 B) — o bônus do jogador na MASMORRA: talento de PvE no ATK + equipamento em ATK/DEF/SPD, um teto de 5% na soma. */
export function useDungeonBonus(): AttrBonus {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  const equipment = ctx?.gameState.equipment;
  return useMemo(() => dungeonAttrBonus(talentBonus(picks, bondLevelFor(xp ?? 0), 'pve'), equipment), [picks, xp, equipment]);
}

export interface PvpTalents {
  /** ATK/DEF/SPD distintos; a SOMA dos três nunca passa de 5% (`combinedAttrBonus`). */
  readonly bonus: AttrBonus;
  /** Rendimento da torcida do Duelo (1 sem o nó `tal-pvp-05`). */
  readonly cheerScale: number;
  /** Tarefa B: energia de largada (`tal-pvp-04`) e resistência ao dano contínuo (`tal-pvp-06`), as do servidor (`_duel.js › duelSide`). */
  readonly startEnergy: number;
  readonly dotResist: number;
}

/** PR7b — o que o talento dá no Duelo (e no treino), o MESMO que o servidor aplica (`_duel.js › duelSide`). Sem provider vale 0 / 1. */
export function usePvpTalents(): PvpTalents {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  const equipment = ctx?.gameState.equipment;
  return useMemo(() => {
    const bond = bondLevelFor(xp ?? 0);
    // PR8: talento + equipamento por atributo, UM teto de 5% na soma dos três canais (o servidor recalcula o mesmo, `_duel.js`).
    return { bonus: combinedAttrBonus({ talent: talentAttrBonus(picks, bond), equipment: equipAttrBonus(equipment) }), cheerScale: talentCheerScale(picks, bond), startEnergy: talentStartEnergy(picks, bond), dotResist: talentDotResist(picks, bond) };
  }, [picks, xp, equipment]);
}

export { NO_ATTR_BONUS };

export interface RiftTalents {
  /** `tal-pve-03`: fração do HP máximo a mais na cura entre andares da Masmorra. */
  readonly healBoost: number;
  /** `tal-pve-04`: fração a mais nos Bits ganhos na fenda (a base nunca diminui). */
  readonly riftBits: number;
  /** `tal-pve-07`: fração do HP máximo em escudo no começo da luta. */
  readonly startShield: number;
}

/** Tarefa B (§2.38) — o que o talento dá na FENDA além do % de combate: cura, Bits e escudo de largada. Sem provider vale 0. */
export function useRiftTalents(): RiftTalents {
  const ctx = useGameStateOptional();
  const xp = ctx?.gameState.totalXP;
  const picks = ctx?.gameState.talentPicks;
  return useMemo(() => {
    const bond = bondLevelFor(xp ?? 0);
    return { healBoost: talentHealBoost(picks, bond), riftBits: talentRiftBits(picks, bond), startShield: talentStartShield(picks, bond) };
  }, [picks, xp]);
}

/** Bits ganhos na fenda com o talento: nunca menos que a base, arredondado para baixo no extra. */
export function riftBitsWith(points: number, extra: number): number {
  return points + Math.floor(Math.max(0, points) * Math.max(0, extra));
}
