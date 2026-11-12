// QUEM PASSA A MISSÃO (12/11/2026, REGISTRO §314): nome curto e retrato do NPC de uma missão do dia. Um dono só — as falas/nomes vêm
// de `utils/areaNpcVoice.ts` e a arte de `assets/soulmon/npcs`; aqui só se resolve a CHAVE (`area:lote`, `papus`, `nuri`).
import type { Language } from '../../utils/i18n';
import type { BuildingId } from '../../utils/gates';
import { LOT_NPC_VOICE, functionNpcVoice } from '../../utils/areaNpcVoice';
import { FUNCTION_NPC_ART, LOT_NPC_ART, NPC_MENSAGEIRO_ART } from '../../assets/soulmon/npcs';

export interface MissionGiver { name: string; art: string }

/** "Vesca, a alquimista" → "Vesca" (o ofício fica para a ficha do NPC; o cartão é pequeno). */
const shortName = (full: string): string => full.split(',')[0].trim();

/** A chave `area:lote` do prédio de uma missão que não tem NPC próprio (as diárias comuns): quem recebe a pessoa naquele prédio. */
export const npcKeyOfBuilding = (b: BuildingId): string => b.replace('.', ':');

export function giverOf(key: string | undefined, language: Language): MissionGiver | undefined {
  if (!key) return undefined;
  if (key === 'papus') return { name: 'Papus', art: NPC_MENSAGEIRO_ART };
  if (key === 'nuri') return { name: shortName(functionNpcVoice('cuidados', language).name), art: FUNCTION_NPC_ART.cuidados };
  const voice = LOT_NPC_VOICE[key];
  const art = LOT_NPC_ART[key];
  if (!voice || !art) return undefined;
  return { name: shortName(language === 'pt-BR' ? voice.namePt : voice.nameEn), art };
}
