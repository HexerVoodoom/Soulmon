/**
 * NPCs de área (minimal-ui F4) — um busto por área do Mapa, pixel art com
 * contorno preto e alfa real (`gpt_image_2 --background transparent`, regra
 * máxima do dono). Originais em `E:/Soulmon-assets/iso-20260923/npcs/final/`
 * (aprovados 23/09/2026, `product/squad-minimal-ui/propostas/npcs/FILA.md`):
 * mercado/arena/laboratorio usam a v3 (revisada), jogos/exploração/hall a v1
 * (ainda não tiveram revisão pedida).
 */
import type { AreaId } from '../../../navigation';
import type { FunctionNpcId, ExtraNpcId } from '../../../utils/areaNpcVoice';

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

import npcArenaDuelo from './npc-arena-duelo.png';
import npcArenaFeira from './npc-arena-feira.png';
import npcJogosMente from './npc-jogos-mente.png';
import npcJogosRefugio from './npc-jogos-refugio.png';
import npcMercadoConquistas from './npc-mercado-conquistas.png';
import npcHallAmigos from './npc-hall-amigos.png';
import npcFGuarda from './npc-f-guarda.png';
import npcLaboratorioPet from './npc-laboratorio-pet.png';
import npcLaboratorioStats from './npc-laboratorio-stats.png';
import npcExploracaoPasseio from './npc-exploracao-passeio.png';

/**
 * NPC por SUB-LOJA (minimal-ui F4/F5, decisão do dono 28/09/2026): cada lote
 * dentro de uma área tem o seu próprio vendedor/anfitrião — não existe mais
 * um único NPC "da área inteira" espiando toda folha. Onde a área só tem UM
 * lote (Laboratório, Hall, Jogos), o antigo anfitrião da área vira o NPC
 * daquele lote (a folha é a única porta de entrada dele mesmo assim).
 *
 * Os bustos de lote (30/09/2026, leva `npcs-flare` aprovada pelo dono —
 * `E:/Soulmon-assets/out/rodada3/npcs-flare/ROSTER.md`, 768², alfa binário)
 * substituíram os placeholders: o antigo mapa de placeholders (coruja-cervo e o
 * slime com nome de franquia de terceiro, achado A3 da bíblia das áreas §1.3)
 * saiu do bundle. Nome e fala de cada um: `utils/areaNpcVoice.ts`.
 */
export const LOT_NPC_ART: Record<string, string> = {
  'mercado:itens': npcLojaItens,
  'mercado:decoracao': npcLojaDecoracao,
  'mercado:background': npcLojaBackground,
  'mercado:conquistas': npcMercadoConquistas, // Medra
  'arena:torneio': npcArena,
  'arena:duelo': npcArenaDuelo, // Rhinoco
  'arena:feira': npcArenaFeira, // Fanfare (`utils/fairArt.ts` › FAIR_ART_IDS.npc)
  'exploracao:masmorra': npcExploracao,
  'exploracao:passeio': npcExploracaoPasseio, // Brume
  // Os três prédios de Jogos (30/09/2026): o Pipo segue no Salão (jogos livres).
  'jogos:salao': npcJogos,
  'jogos:mente': npcJogosMente, // Tessela
  'jogos:refugio': npcJogosRefugio, // Bobbi
  'laboratorio:evolucao': npcLaboratorio,
  'laboratorio:pet': npcLaboratorioPet, // Bento
  'laboratorio:stats': npcLaboratorioStats, // Quill
  'hall:biblioteca': npcHall,
  'hall:amigos': npcHallAmigos, // Nino
  'hall:guilda': npcFGuarda, // Bastia (G3, 02/10/2026: trocou a Marla-árvore; mesmo busto de EXTRA_NPC_ART.guarda)
};

import npcOnboarding from './npc-onboarding.png';
import npcOraculo from './npc-oraculo.png';
import npcConta from './npc-conta.png';
import npcSono from './npc-sono.png';
import npcCuidados from './npc-cuidados.png';
import npcConfig from './npc-config.png';

/**
 * NPCs de FUNÇÃO (30/09/2026, mesma leva `npcs-flare`): os bustos que não
 * moram num lote do Mapa, e sim numa função do app. ⚠️ **SEM CHAMADA HOJE**:
 * a arte está instalada e registrada, mas NENHUMA tela desenha estes bustos —
 * onde cada um entra é decisão de design (`docs/PERGUNTAS-DO-DONO.md`, "onde
 * cada NPC de função aparece", com a recomendação do ROSTER). Nome e fala:
 * `utils/areaNpcVoice.ts` › `FUNCTION_NPC_VOICE`.
 */
export const FUNCTION_NPC_ART: Record<FunctionNpcId, string> = {
  onboarding: npcOnboarding, // Ambra
  oraculo: npcOraculo, // Iris
  conta: npcConta, // Faro
  sono: npcSono, // Sona
  cuidados: npcCuidados, // Nuri
  config: npcConfig, // Tobi
};

import npcFForja from './npc-f-forja.png';
import npcFTreino from './npc-f-treino.png';
import npcFCacadora from './npc-f-cacadora.png';
import npcFFeras from './npc-f-feras.png';
import npcFCura from './npc-f-cura.png';
import npcFMercenaria from './npc-f-mercenaria.png';
import npcFNavegadora from './npc-f-navegadora.png';
import npcFBarda from './npc-f-barda.png';
import npcFVenenos from './npc-f-venenos.png';
import npcFArqueira from './npc-f-arqueira.png';
import npcFSacerdotisa from './npc-f-sacerdotisa.png';
import npcFLua from './npc-f-lua.png';
import npcFFerreiro from './npc-f-ferreiro.png';
import npcFFerreira from './npc-f-ferreira.png';

/**
 * NPCs EXTRAS (01/10/2026, leva `npcs-femininas` aprovada pelo dono —
 * `E:/Soulmon-assets/out/rodada3/npcs-femininas/ROSTER.md`, 768², alfa
 * binário): 12 bustos de ofício que ainda não têm lote nem função no app. Em 01/10/2026
 * (instalação final da rodada 3) entraram mais 3 do banco: a rainha da lua (`lua`, Selene) e
 * o casal de ferreiros (`ferreiro`, Mallo; `ferreira`, Kova) — `npc-lua` e `npc-martelo`, mesmo
 * pós (768², alfa binário, 0 px de matiz 270–340).
 * ⚠️ **SEM CHAMADA HOJE** — onde cada uma entra é decisão de design
 * (`docs/PERGUNTAS-DO-DONO.md`, item NPC-1). Nome e fala:
 * `utils/areaNpcVoice.ts` › `EXTRA_NPC_VOICE`. O arquivo da Zahra chama
 * `npc-f-feras.png` (no lote de origem tinha outro nome, com termo vetado
 * pela `narrativa.contract`).
 */
export const EXTRA_NPC_ART: Record<ExtraNpcId, string> = {
  forja: npcFForja, // Scoria
  treino: npcFTreino, // Kama
  cacadora: npcFCacadora, // Sable
  guarda: npcFGuarda, // Bastia
  feras: npcFFeras, // Zahra
  cura: npcFCura, // Salvia
  mercenaria: npcFMercenaria, // Gila
  navegadora: npcFNavegadora, // Vela
  barda: npcFBarda, // Trill
  venenos: npcFVenenos, // Datura
  arqueira: npcFArqueira, // Rime
  sacerdotisa: npcFSacerdotisa, // Oriel
  lua: npcFLua, // Selene
  ferreiro: npcFFerreiro, // Mallo
  ferreira: npcFFerreira, // Kova
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
