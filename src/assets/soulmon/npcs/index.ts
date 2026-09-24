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

import npcLojaItens from './npc-loja-itens.png';
import npcLojaDecoracao from './npc-loja-decoracao.png';
import npcLojaBackground from './npc-loja-background.png';

/**
 * Os vendedores das lojinhas do Mercado (minimal-ui F5), um por lojinha, como
 * no mock `propostas/loja/mock.html`. Originais em `npcs/final/npc-loja-*.png`
 * (768², alfa real). ⚠️ São os rascunhos em média qualidade — refazer em alta
 * está na fila (`BACKLOG-CREDITOS.md` #5–#7). Conquistas ainda não tem NPC
 * próprio (#1, o carneiro paladino): cai no anfitrião do Mercado.
 */
export const STALL_NPC_ART = {
  itens: npcLojaItens,
  decoracao: npcLojaDecoracao,
  background: npcLojaBackground,
} as const;
