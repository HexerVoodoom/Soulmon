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
 * está na fila (`BACKLOG-CREDITOS.md` #5–#7).
 */
export const STALL_NPC_ART = {
  itens: npcLojaItens,
  decoracao: npcLojaDecoracao,
  background: npcLojaBackground,
} as const;

import npcPlaceholderCorujaCervo from './npc-placeholder-coruja-cervo.png';
import npcPlaceholderPoring from './npc-placeholder-poring.png';

/**
 * Sobras de geração do Higgsfield (23/09/2026, run de bestiário/NPCs — nunca
 * instaladas antes) reaproveitadas como placeholder de sub-lojas que ainda
 * não têm vendedor próprio desenhado: a coruja-cervo (owl-stag, cientista de
 * evolução) e o poring (slime alquimista). Trocar pela arte definitiva quando
 * a squad-arte gerar o NPC dedicado — não é arte final, é placeholder.
 */
export const PLACEHOLDER_NPC_ART = {
  corujaCervo: npcPlaceholderCorujaCervo,
  poring: npcPlaceholderPoring,
  /** ⚠️ AINDA SEM ARTE DO RINOCERONTE (Rinoco, Duelo da Arena, 29/09/2026):
   *  reaproveita o poring até a squad-arte gerar o busto dele. Quando chegar,
   *  é só trocar este import — o mapa `LOT_NPC_ART` já aponta para cá. */
  rinoceronte: npcPlaceholderPoring,
} as const;

/**
 * NPC por SUB-LOJA (minimal-ui F4/F5, decisão do dono 28/09/2026): cada lote
 * dentro de uma área tem o seu próprio vendedor/anfitrião — não existe mais
 * um único NPC "da área inteira" espiando toda folha. Onde a área só tem UM
 * lote (Laboratório, Hall, Jogos), o antigo anfitrião da área vira o NPC
 * daquele lote (a folha é a única porta de entrada dele mesmo assim). Onde
 * não há arte própria ainda, cai num `PLACEHOLDER_NPC_ART`.
 */
const LOT_NPC_ART: Record<string, string> = {
  'mercado:itens': npcLojaItens,
  'mercado:decoracao': npcLojaDecoracao,
  'mercado:background': npcLojaBackground,
  'mercado:conquistas': npcPlaceholderPoring,
  'arena:torneio': npcArena,
  'arena:duelo': PLACEHOLDER_NPC_ART.rinoceronte,
  // Fanfa (`npc-arena-feira`): PLACEHOLDER até a leva de arte (ids em `utils/fairArt.ts`). Só trocar aqui.
  'arena:feira': npcPlaceholderCorujaCervo,
  'exploracao:masmorra': npcExploracao,
  'exploracao:dino': npcPlaceholderPoring,
  'jogos:ppt': npcJogos,
  'laboratorio:evolucao': npcLaboratorio,
  'hall:biblioteca': npcHall,
  'hall:amigos': npcPlaceholderCorujaCervo,
  'hall:guilda': npcPlaceholderCorujaCervo,
  'laboratorio:pet': npcPlaceholderCorujaCervo,
  'laboratorio:stats': npcPlaceholderPoring,
};

/** Resolve o NPC de UMA folha (área + id do lote). Sem lote aberto, ou lote
 *  sem mapeamento próprio, cai no anfitrião histórico da área. */
export function lotNpcArt(areaId: AreaId, lotId?: string | null): string {
  if (lotId) {
    const art = LOT_NPC_ART[`${areaId}:${lotId}`];
    if (art) return art;
  }
  return AREA_NPC_ART[areaId];
}
