/**
 * COPY DOS LOTES por área (minimal-ui F4 exemplo + F5 lotes reais).
 *
 * `areaDemoLot` é o rótulo do lote ÚNICO das áreas sem construções próprias
 * (hoje Laboratório e Hall — `AreaView`). O texto de placeholder do molde F4
 * ("chega na próxima fatia") saiu no fechamento F6: toda folha já tem conteúdo
 * real. Dono único desta copy, para nenhum componente escrever texto de UI
 * solto dentro do JSX.
 */
import type { Language } from './i18n';
import type { AreaId } from '../navigation';
import { GUILD_COPY } from './guildCopy';

const AREA_DEMO_LOT: Record<AreaId, { labelPt: string; labelEn: string }> = {
  mercado: { labelPt: 'Itens', labelEn: 'Items' },
  jogos: { labelPt: 'Pedra, papel e tesoura', labelEn: 'Rock, paper, scissors' },
  arena: { labelPt: 'Torneio', labelEn: 'Tournament' },
  exploracao: { labelPt: 'Masmorra', labelEn: 'Dungeon' },
  laboratorio: { labelPt: 'Evolução', labelEn: 'Evolution' },
  hall: { labelPt: 'Biblioteca', labelEn: 'Library' },
};

export function areaDemoLot(id: AreaId, language: Language): { label: string } {
  const c = AREA_DEMO_LOT[id];
  return { label: language === 'pt-BR' ? c.labelPt : c.labelEn };
}

/**
 * OS LOTES REAIS (minimal-ui F5) — as construções de cada área que já têm
 * conteúdo de verdade, com rótulo PT/EN, o que o leitor de tela anuncia e a
 * posição do CENTRO DA BASE em % da cena (tirada do mock aprovado de cada
 * área, `propostas/<area>/mock.html`, descontada a barra do topo). Área que
 * ainda não chegou em F5 não aparece aqui e segue no lote de exemplo acima.
 */
export type MercadoLotId = 'itens' | 'decoracao' | 'background' | 'conquistas' | 'ferreiro';
export type ArenaLotId = 'torneio' | 'duelo' | 'feira';
export type LaboratorioLotId = 'evolucao' | 'pet' | 'stats';
export type HallLotId = 'biblioteca' | 'amigos' | 'guilda';

interface AreaLotSpec<K extends string> {
  id: K;
  labelPt: string; labelEn: string;
  ariaPt: string; ariaEn: string;
  left: string; top: string;
  /** Largura em % da cena; sem ela, a do molde (`LOT_WIDTH_DEFAULT`, 38%). */
  width?: string;
}

// 🏛️ 02/10/2026 (H12, navegação do dono): a torre de Conquistas (sprite alto e estreito, só 50% da
// largura opaca) ficava minúscula no lote de baixo. Opção (b) do dono: Conquistas SOBE para o espaço
// de cima da direita, ATRÁS, com a base do tamanho do espaço (lote de 64% da largura, centrado no
// pé do tablado) e a ponta quase saindo do quadro por cima; a Decoração DESCE para o losango de baixo
// (um pouco maior, 42%, para cobrir o losango do fundo). Itens e Background não mudam.
const MERCADO_LOTS: AreaLotSpec<MercadoLotId>[] = [
  { id: 'itens', labelPt: 'Itens', labelEn: 'Items', ariaPt: 'Entrar na lojinha de Itens', ariaEn: 'Enter the Items stall', left: '26%', top: '33%' },
  { id: 'conquistas', labelPt: 'Conquistas', labelEn: 'Achievements', ariaPt: 'Entrar em Conquistas', ariaEn: 'Enter Achievements', left: '72%', top: '29%', width: '64%' },
  { id: 'background', labelPt: 'Background', labelEn: 'Background', ariaPt: 'Entrar na lojinha de Background', ariaEn: 'Enter the Background stall', left: '26%', top: '55%' },
  { id: 'decoracao', labelPt: 'Decoração', labelEn: 'Decor', ariaPt: 'Entrar na lojinha de Decoração', ariaEn: 'Enter the Decor stall', left: '72%', top: '55%', width: '42%' },
  // ⚒️ 07/10/2026 (reforma dos lotes, pedido do dono): o Soulsmith — os EQUIPAMENTOS. Coluna da ESQUERDA, alinhada com Itens e Background, no chão livre de baixo;
  // a direita de baixo fica livre para uma futura loja.
  { id: 'ferreiro', labelPt: 'Soulsmith', labelEn: 'Soulsmith', ariaPt: 'Entrar no Soulsmith', ariaEn: 'Enter the Soulsmith', left: '26%', top: '81%', width: '44%' },
];

// ⚔️ 01/10/2026 (H15, navegação do dono): o fundo da Arena tem DOIS tablados.
// Torneio e Duelo — os dois de luta — dividem o tablado da esquerda (cabem dois
// por espaço, um em cada metade da diagonal), e a Feira fica sozinha no da
// direita. Antes a Feira caía fora dos tablados, na escadaria de baixo.
const ARENA_LOTS: AreaLotSpec<ArenaLotId>[] = [
  { id: 'torneio', labelPt: 'Torneio', labelEn: 'Tournament', ariaPt: 'Entrar no Torneio', ariaEn: 'Enter the Tournament', left: '19%', top: '49%', width: '40%' },
  { id: 'duelo', labelPt: 'Duelo', labelEn: 'Duel', ariaPt: 'Entrar no Duelo', ariaEn: 'Enter the Duel', left: '50%', top: '56%', width: '40%' },
  // O lote da Arena é a FEIRA (`guild.lote.feira.*`, D-G4, WPG-10): abre a sala Feira do
  // `GuildSheet`. O Salão (Bosque/Roda/Mural) continua sendo o lote `guilda` do Hall.
  { id: 'feira', labelPt: GUILD_COPY['guild.lote.feira.label'][0], labelEn: GUILD_COPY['guild.lote.feira.label'][1], ariaPt: GUILD_COPY['guild.lote.feira.aria'][0], ariaEn: GUILD_COPY['guild.lote.feira.aria'][1], left: '78%', top: '40%', width: '36%' },
];

// Laboratório e Hall (29/09/2026): as antigas abas/filtros viraram construções
// do mapa aberto, como nas lojas. Nomes pensados como LUGARES, não como abas.
// 🌙 30/09/2026 — os fundos pintados (`HALL_BG`/`LABORATORIO_BG`) chegaram, e as
// posições seguem as clareiras medidas pelo gerador (fundos-v2/MANIFEST.md):
// no Laboratório os hexágonos de cima vão de 43% a 62% (centro ~52%), então os
// 2 lotes de cima descem de 42% para 54% (50% deixava o prédio na metade
// de cima do hexágono; 54% centraliza — conferido no preview em 30/09); no Hall o quadrado de baixo começa em
// ~73% (centro ~79%), então o Salão da Guilda desce de 72% para 78%. O `top` é o
// pé do lote (`translate(-50%, -80%)` no `AreaScene`).
// 🔭 01/10/2026 (H16/H17, navegação do dono): prédios MAIORES. No Laboratório o
// Santuário do Vínculo (ex-Observatório) fica significativamente maior que os vizinhos, e os dois de cima
// crescem um pouco e descem para assentar no hexágono. No Hall os três crescem.
// 🗺️ 04/10/2026 (H18, fundos refeitos — `entrada-dono/05-bg-*`, GPT Image 2): plataformas NOVAS.
// Medidas no fundo final renderizado em `cover` a 390×844 (o `left` é % da TELA, não da imagem:
// o `cover` corta ~11% de cada lado, então a plataforma em 26% da imagem cai em ~22% da tela).
// Hall: dois losangos em cima (centro ~22/37 e ~78/37 na tela) e um grande embaixo (~50/66).
// Laboratório: o hexágono GRANDE subiu (centro ~50/41, o Santuário do Vínculo) e os dois menores desceram
// (~22/66 e ~78/66). O `top` é o pé do prédio, um pouco à frente do centro da plataforma. Prévia:
// `E:/Soulmon-assets/out/instalacao-20261004/areas/prancha-01-hall-lab-lotes.png`.
const LABORATORIO_LOTS: AreaLotSpec<LaboratorioLotId>[] = [
  { id: 'evolucao', labelPt: 'Centro de Evolução', labelEn: 'Evolution Center', ariaPt: 'Entrar no Centro de Evolução', ariaEn: 'Enter the Evolution Center', left: '22%', top: '70%', width: '44%' },
  { id: 'pet', labelPt: 'Arquivo', labelEn: 'Archive', ariaPt: 'Entrar no Arquivo', ariaEn: 'Enter the Archive', left: '78%', top: '70%', width: '50%' },
  { id: 'stats', labelPt: 'Santuário do Vínculo', labelEn: 'Bond Sanctum', ariaPt: 'Entrar no Santuário do Vínculo (estatísticas)', ariaEn: 'Enter the Bond Sanctum (stats)', left: '50%', top: '43%', width: '62%' },
];

const HALL_LOTS: AreaLotSpec<HallLotId>[] = [
  { id: 'biblioteca', labelPt: 'Biblioteca', labelEn: 'Library', ariaPt: 'Entrar na Biblioteca', ariaEn: 'Enter the Library', left: '22%', top: '40%', width: '44%' },
  { id: 'amigos', labelPt: 'Círculo de Amigos', labelEn: 'Friends Circle', ariaPt: 'Entrar no Círculo de Amigos', ariaEn: 'Enter the Friends Circle', left: '78%', top: '40%', width: '44%' },
  { id: 'guilda', labelPt: GUILD_COPY['guild.lote.hall.label'][0], labelEn: GUILD_COPY['guild.lote.hall.label'][1], ariaPt: GUILD_COPY['guild.lote.hall.aria'][0], ariaEn: GUILD_COPY['guild.lote.hall.aria'][1], left: '50%', top: '70%', width: '58%' },
];

function resolveLots<K extends string>(specs: AreaLotSpec<K>[], language: Language) {
  const isPt = language === 'pt-BR';
  return specs.map(s => ({
    id: s.id,
    label: isPt ? s.labelPt : s.labelEn,
    ariaLabel: isPt ? s.ariaPt : s.ariaEn,
    left: s.left, top: s.top,
    ...(s.width ? { width: s.width } : {}),
  }));
}

export function mercadoLots(language: Language) { return resolveLots(MERCADO_LOTS, language); }
export function arenaLots(language: Language) { return resolveLots(ARENA_LOTS, language); }
export function laboratorioLots(language: Language) { return resolveLots(LABORATORIO_LOTS, language); }
export function hallLots(language: Language) { return resolveLots(HALL_LOTS, language); }
