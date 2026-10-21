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

import npcPerfilCorvo from './npc-perfil-corvo.png';
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

import npcArenaDuelo from './npc-extra-arena-duelo.png';
import npcArenaFeira from './npc-arena-feira.png';
import npcArenaGuerra from './npc-arena-guerra.png';
import npcJogosMente from './npc-jogos-mente.png';
import npcJogosRefugio from './npc-oceano-jogos-refugio.png';
import npcMercadoConquistas from './npc-mercado-conquistas.png';
import npcFGuarda from './npc-f-guarda.png';
import npcExploracaoPasseio from './npc-exploracao-passeio.png';
import npcExploracaoOficina from './npc-exploracao-caderno.png'; // D-32 (19/10/2026): o NPC da Focus Workshop = a escolha 9 do dono (o escriba-polvo-coruja), no lugar da Lume
import npcExploracaoCaderno from './npc-akasha-exploracao-caderno.png';
import npcLaboratorioPet from './npc-agua-laboratorio-pet.png';
import npcLaboratorioStats from './npc-agua-laboratorio-stats.png';
import npcHallGuildaLuz from './npc-luz-hall-guilda.png';
import npcHallAmigosMel from './npc-extra-filhote-de-mel.png';
import npcHallGrove from './npc-n-musa.png'; // D-50 (19/10/2026): o NPC do Grove = a escolha 57 do dono (Lilia, a musa do jardim)

import npcFForjaFerreiro from './npc-mercado-ferreiro.png';
import npcMercadoRestaurante from './npc-mercado-restaurante.png';
/**
 * 🦎 O NPC do SOULSMITH — ÚNICO ponto de troca (07/10/2026). Escolha do dono: o espírito-do-forno vidraceiro
 * (`dominios/industrial/npcs/npc-industrial-espirito-forno-vidraceiro`, a 'salamandra de vidro industrial').
 */
const FERREIRO_NPC_ART = npcFForjaFerreiro;

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
  'mercado:ferreiro': FERREIRO_NPC_ART,
  'mercado:restaurante': npcMercadoRestaurante, // Tijolino, o caranguejo pedreiro (14/10/2026; restaurante em obra)
  'arena:torneio': npcArena,
  'arena:duelo': npcArenaDuelo, // Naia (07/10/2026: trocou o Tuska)
  'arena:guerra': npcArenaGuerra, // Mirevesper: arte escolhida pelo dono em 18/10/2026 — ver docs/ARTE-MELHORIAS-FUTURAS.md
  'hall:feira': npcArenaFeira, // Fanfare (`utils/fairArt.ts` › FAIR_ART_IDS.npc)
  'exploracao:masmorra': npcExploracao,
  'exploracao:passeio': npcExploracaoPasseio, // Amandha
  // 04/10/2026: bustos PRÓPRIOS (`entrada-dono/npc-exploracao-*`, 768², alfa binário); até aqui eram
  // os da Kova e da Selene. As versões `-b` ficaram fora do bundle (`E:/Soulmon-assets/instalados/alternativas/`).
  'exploracao:oficina': npcExploracaoOficina, // Lume (vagalume do coro; 07/10/2026 trocou o Tique)
  'exploracao:caderno': npcExploracaoCaderno, // Opala (geleia-fantasma arquivista; 07/10/2026 trocou a Sépia)
  // Os três prédios de Jogos (30/09/2026): o Pipo segue no Salão (jogos livres).
  'jogos:salao': npcJogos,
  'jogos:mente': npcJogosMente, // Tessela
  'jogos:refugio': npcJogosRefugio, // Marim (07/10/2026: trocou o Bobbi)
  'laboratorio:evolucao': npcLaboratorio,
  'laboratorio:pet': npcLaboratorioPet, // Tinta (enguia escriba; 07/10/2026 trocou o Faro)
  'laboratorio:stats': npcLaboratorioStats, // Sumi (koi-dragão sábio; 07/10/2026 trocou a Oriel — `npc-f-sacerdotisa` segue em EXTRA_NPC_ART)
  'laboratorio:perfil': npcPerfilCorvo, // o Corvo em alta qualidade, 768² (15/10/2026, variação 1 do dono); antes o mascote 384² (14/10/2026, decisão do dono: o Perfil não usa o busto da Iris/Oráculo nem o da Oriel; `npc-f-sacerdotisa` segue em EXTRA_NPC_ART)
  'laboratorio:biblioteca': npcHall, // D-50 (19/10/2026): Biblioteca e Amigos mudaram do Hall para o Laboratório — o mesmo NPC de antes
  'laboratorio:amigos': npcHallAmigosMel, // Zumi (filhote de mel; 07/10/2026 trocou o Ramo, o carvalho — o Ramo agora é o 'hall:grove'; `npc-hall-guilda.png` segue em disco, sem import)
  'hall:grove': npcHallGrove, // Ramo (carvalho; D-50, 19/10/2026: o Grove é prédio do Hall)
  'hall:guilda': npcHallGuildaLuz, // Aurea (leoa solar; 07/10/2026 trocou a Bastia — `npc-f-guarda` segue em EXTRA_NPC_ART)
};

import npcOnboarding from './npc-onboarding.png';
import npcOraculo from './npc-oraculo.png';
import npcCuidados from './npc-cuidados.png';

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
  cuidados: npcCuidados, // Nuri
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


import type { NovoNpcId } from '../../../utils/areaNpcVoice';
import npcNAlquimistaLimo from './npc-n-alquimistaLimo.png';
import npcNEnfermeira from './npc-n-enfermeira.png';
import npcNColheita from './npc-n-colheita.png';
import npcNTempo from './npc-n-tempo.png';
import npcNMusa from './npc-n-musa.png';
import npcNOssarioFera from './npc-n-ossarioFera.png';
import npcNOssarioForma from './npc-n-ossarioForma.png';
import npcNSerpentePlumadaFera from './npc-n-serpentePlumadaFera.png';
import npcNSerpentePlumadaForma from './npc-n-serpentePlumadaForma.png';
import npcNBroto from './npc-n-broto.png';
import npcNCorvo from './npc-n-corvo.png';
import npcNCozinheiro from './npc-n-cozinheiro.png';
import npcNBesouro from './npc-n-besouro.png';
import npcNLuaTronoSentada from './npc-n-luaTronoSentada.png';
import npcNLuaTronoDePe from './npc-n-luaTronoDePe.png';

/**
 * NPCs NOVOS (15/10/2026, leva `E:/novos npcs` — 17 PNG do Higgsfield, 15 instalados):
 * 11 criaturas/guardiãs em busto 768² + Selene em duas poses de trono, a
 * alquimista de limo e a enfermeira (corpo inteiro / busto). Alfa binarizado em
 * 128 (o original vinha ~252, não 255) e arte `npc-n-<id>.png`. A enfermeira
 * (xadrez assado) e a alquimista (fundo preto) tiveram o fundo recortado por
 * flood-fill a partir da borda; a sereia e a alquimista de costas ficaram de
 * fora (fundo em degradê / pose só de costas — `docs/NPCS-NOVOS.md`).
 * ⚠️ **SEM CHAMADA HOJE**, como os extras — onde entram é decisão de design
 * (`docs/PERGUNTAS-DO-DONO.md`, NPC-1). Nome, fala e categoria:
 * `utils/areaNpcVoice.ts` › `NOVO_NPC_VOICE`.
 */
export const NOVO_NPC_ART: Record<NovoNpcId, string> = {
  alquimistaLimo: npcNAlquimistaLimo,
  enfermeira: npcNEnfermeira,
  colheita: npcNColheita,
  tempo: npcNTempo,
  musa: npcNMusa,
  ossarioFera: npcNOssarioFera,
  ossarioForma: npcNOssarioForma,
  serpentePlumadaFera: npcNSerpentePlumadaFera,
  serpentePlumadaForma: npcNSerpentePlumadaForma,
  broto: npcNBroto,
  corvo: npcNCorvo,
  cozinheiro: npcNCozinheiro,
  besouro: npcNBesouro,
  luaTronoSentada: npcNLuaTronoSentada,
  luaTronoDePe: npcNLuaTronoDePe,
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
