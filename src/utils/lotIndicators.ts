/**
 * INDICADORES NOS PRÉDIOS DO MAPA (pedido do dono, 04/11/2026): um ícone sobre o prédio quando há algo a GASTAR nele.
 *  · `forja.ferreiro` (Soulsmith): algum equipamento tem os materiais, o Vínculo e o nível para o próximo aprimoramento.
 *  · `laboratorio.stats` (Santuário do Vínculo): há pontos de talento livres.
 * Puro (só lê o save), sem rede e sem relógio. É um sinal de oportunidade, não de urgência: nada some sozinho nem cobra.
 * Independente das marcas "!"/"?"/moeda (`utils/lotMarks.ts`): a camada de cada uma é própria, para as duas conviverem.
 */
import { bondLevelFor } from './bond';
import { sanitizeTalentPicks, pointsLeft } from './talents';
import { EQUIP_SLOTS, sanitizeEquipment, type EquipSlot } from './equipment';
import { FORGE_MAX_LEVEL, FORGE_PIECES } from './forge';
import { levelNow, upgradeRefusal, type ForgeGameState } from './forgeActions';

export type LotIndicatorId = 'forge' | 'talent';

type SaveLike = Partial<ForgeGameState> & { totalXP?: number; talentPicks?: unknown };

function forgeView(gs: SaveLike): ForgeGameState {
  const bond = bondLevelFor(gs.totalXP ?? 0);
  return {
    gamePoints: gs.gamePoints, bitsOrigin: gs.bitsOrigin, equipment: sanitizeEquipment(gs.equipment), forge: gs.forge,
    buildingQuests: gs.buildingQuests, totalXP: gs.totalXP, talentPicks: sanitizeTalentPicks(gs.talentPicks, bond),
  } as ForgeGameState;
}

/** Os equipamentos que PODEM subir de nível agora (peça possuída, abaixo do teto, sem recusa). */
export function forgeReadySlots(gs: SaveLike | undefined | null): ReadonlySet<EquipSlot> {
  const out = new Set<EquipSlot>();
  if (!gs) return out;
  const view = forgeView(gs);
  const eq = view.equipment!;
  for (const slot of EQUIP_SLOTS) {
    const id = eq.equipped[slot];
    const piece = (id && FORGE_PIECES.find((p) => p.id === id)) || FORGE_PIECES.find((p) => p.slot === slot && p.tier === 1);
    if (!piece) continue;
    const level = levelNow(view, piece.id);
    if (level > 0 && level < FORGE_MAX_LEVEL && !upgradeRefusal(view, piece.id)) out.add(slot);
  }
  return out;
}

/** Há ponto de talento livre? (derivado do Vínculo e das escolhas, nunca guardado). */
export function talentPointsFree(gs: SaveLike | undefined | null): number {
  if (!gs) return 0;
  const bond = bondLevelFor(gs.totalXP ?? 0);
  return pointsLeft(sanitizeTalentPicks(gs.talentPicks, bond), bond);
}

/** Id do prédio (`área.lote`) → indicador aceso. Só entram os que têm algo a gastar. */
export function lotIndicators(gs: SaveLike | undefined | null): Readonly<Record<string, LotIndicatorId>> {
  const out: Record<string, LotIndicatorId> = {};
  if (forgeReadySlots(gs).size > 0) out['forja.ferreiro'] = 'forge';
  if (talentPointsFree(gs) > 0) out['laboratorio.stats'] = 'talent';
  return out;
}
