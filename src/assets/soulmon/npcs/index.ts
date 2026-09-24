/**
 * NPCs de área (minimal-ui F4) — um busto por área do Mapa, pixel art com
 * contorno preto e alfa real (`gpt_image_2 --background transparent`, regra
 * máxima do dono). Originais em `E:/Soulmon-assets/iso-20260923/npcs/final/`
 * (aprovados 23/09/2026, `product/squad-minimal-ui/propostas/npcs/FILA.md`):
 * mercado/arena/laboratorio usam a v3 (revisada), jogos/exploração/hall a v1
 * (ainda não tiveram revisão pedida).
 */
import type { AreaId } from '../../../navigation';

import npcMercado from './npc-mercado.png';
import npcArena from './npc-arena.png';
import npcLaboratorio from './npc-laboratorio.png';
import npcJogos from './npc-jogos.png';
import npcExploracao from './npc-exploracao.png';
import npcHall from './npc-hall.png';

export const AREA_NPC_ART: Record<AreaId, string> = {
  mercado: npcMercado,
  arena: npcArena,
  laboratorio: npcLaboratorio,
  jogos: npcJogos,
  exploracao: npcExploracao,
  hall: npcHall,
};
