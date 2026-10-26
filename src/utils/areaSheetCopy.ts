/**
 * COPY DOS LOTES por área (minimal-ui F4 exemplo + F5 lotes reais).
 *
 * `areaDemoLot` é o rótulo do lote ÚNICO das áreas sem construções próprias
 * (hoje só o Hall — `AreaView`; o Laboratório tem seis lotes reais desde D-50). O texto de placeholder do molde F4
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
  hall: { labelPt: 'Salão do Clã', labelEn: 'Clan Hall' },
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
export type MercadoLotId = 'itens' | 'decoracao' | 'background' | 'conquistas' | 'ferreiro' | 'restaurante';
export type ArenaLotId = 'torneio' | 'duelo' | 'guerra' | 'fenda';
export type LaboratorioLotId = 'evolucao' | 'pet' | 'stats' | 'perfil' | 'biblioteca' | 'amigos';
export type HallLotId = 'guilda' | 'feira' | 'grove';

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
  { id: 'itens', labelPt: 'Itens', labelEn: 'Items', ariaPt: 'Entrar na lojinha de Itens', ariaEn: 'Enter the Items stall', left: '24.3%', top: '29.5%' },
  { id: 'conquistas', labelPt: 'Conquistas', labelEn: 'Achievements', ariaPt: 'Entrar em Conquistas', ariaEn: 'Enter Achievements', left: '70%', top: '28%', width: '64%' },
  { id: 'background', labelPt: 'Background', labelEn: 'Background', ariaPt: 'Entrar na lojinha de Background', ariaEn: 'Enter the Background stall', left: '24.3%', top: '51%' },
  { id: 'decoracao', labelPt: 'Decoração', labelEn: 'Decor', ariaPt: 'Entrar na lojinha de Decoração', ariaEn: 'Enter the Decor stall', left: '70%', top: '53.5%', width: '42%' },
  // ⚒️ 07/10/2026 (reforma dos lotes, pedido do dono): o Soulsmith — os EQUIPAMENTOS. Coluna da ESQUERDA, alinhada com Itens e Background, no chão livre de baixo;
  // a direita de baixo fica livre para uma futura loja.
  { id: 'ferreiro', labelPt: 'Soulsmith', labelEn: 'Soulsmith', ariaPt: 'Entrar no Soulsmith', ariaEn: 'Enter the Soulsmith', left: '26%', top: '81%', width: '44%' },
  // 🏗️ 14/10/2026 (dono): o Restaurante em obra ocupa a direita de baixo que ficava livre. Só vitrine: NPC e fala, sem ação, sem Vínculo mínimo.
  { id: 'restaurante', labelPt: 'Restaurante', labelEn: 'Restaurant', ariaPt: 'Falar com o pedreiro do Restaurante em obra', ariaEn: 'Talk to the builder of the Restaurant under construction', left: '73%', top: '81%', width: '40%' },
];

// ⚔️ 11/10/2026 (guilda-lancamento PR1): TORNEIO = ranqueado (o servidor sorteia o oponente pela sua
// faixa); ARENA LIVRE (id `duelo`, mantido: telemetria/testes) = você ESCOLHE contra quem lutar.
// ⚔️ 01/10/2026 (H15, navegação do dono): o fundo da Arena tem DOIS tablados.
// Torneio e Duelo — os dois de luta — dividem o tablado da esquerda (cabem dois
// por espaço, um em cada metade da diagonal), e a Feira fica sozinha no da
// direita. Antes a Feira caía fora dos tablados, na escadaria de baixo.
// 🔎 20/10/2026 (§145): o dono marcou 4 VAGAS na captura do app (2 losangos, 2 vagas em cada): Guerra na de cima-direita (P2), Torneio (P3) e Arena livre (P4)
// na diagonal do losango de baixo, e a de cima-esquerda (P1) fica vazia. W19 (§147): a base do Torneio desceu 38 px / foi 25 px à direita (área marcada pelo dono); a Arena livre desceu o mínimo p/ o H11. `left`/`top` = centro da BASE da caixa do botão; o centro visual cai na marca.
const ARENA_LOTS: AreaLotSpec<ArenaLotId>[] = [
  { id: 'torneio', labelPt: 'Torneio', labelEn: 'Tournament', ariaPt: 'Entrar no Torneio', ariaEn: 'Enter the Tournament', left: '25.5%', top: '47.3%', width: '30.8%' },
  { id: 'duelo', labelPt: 'Arena livre', labelEn: 'Open Arena', ariaPt: 'Entrar na Arena livre: você escolhe os adversários', ariaEn: 'Enter the Open Arena: you choose your opponents', left: '41.5%', top: '57.5%', width: '39%' }, // beta-2 (9.3): a Arena livre sai do meio do caminho e assenta no OUTRO tablado (o da direita, livre desde que a Feira foi para o Hall) — um bloco para cada modo
  { id: 'guerra', labelPt: 'Guerra de Clãs', labelEn: 'Clan War', ariaPt: 'Entrar na Guerra de Clãs', ariaEn: 'Enter the Clan War', left: '77.4%', top: '46.7%', width: '38%' },
  // 🌀 beta3 N10 (26/10/2026): a Fenda Sem Fim (a antiga Masmorra) veio da Exploração para a Arena — ocupa a vaga de cima-esquerda (P1) do losango de cima. Arte provisória (a da Masmorra); posição a conferir na tela.
  { id: 'fenda', labelPt: 'Fenda Sem Fim', labelEn: 'Endless Rift', ariaPt: 'Entrar na Fenda Sem Fim', ariaEn: 'Enter the Endless Rift', left: '54.5%', top: '33.5%', width: '50%' },
  // 🔎 11/10/2026 (guilda-lancamento): a FEIRA saiu da Arena e foi para o HALL, ao lado do Salão da Guilda — é a Missão da
  // guilda (`GuildSheet` room `feira`). O tablado da direita da Arena fica livre.
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
// W5 (19/10/2026): fundos NOVOS (variante `e` de cada um; as plataformas saem 5–15 pontos acima do pedido) — `LABORATORIO_LOTS`/`HALL_LOTS` remedidos sobre as
// plataformas reais (centro medido nos PNG 760×1344: Lab 50/38, 20/41, 81/41, 29/64, 71/64, 50/85; Hall 27/39, 74/39, 50/71). Prévias: `_gemini_out/w5-arte-20261019/previas/`.
// Laboratório: o hexágono GRANDE subiu (centro ~50/41, o Santuário do Vínculo) e os dois menores desceram
// (~22/66 e ~78/66). O `top` é o pé do prédio, um pouco à frente do centro da plataforma. Prévia:
// `E:/Soulmon-assets/out/instalacao-20261004/areas/prancha-01-hall-lab-lotes.png`.
// 🧩 W12 (20/10/2026, dono: "encaixa bem certinho os prédios nas áreas"): fundos NOVOS do Laboratório (`Enchanted Treehouse Alchemy Lab`) e do Hall (sem o escurecimento da W8-A) e
// prédio novo da Guerra. Todas as posições REMEDIDAS nos PNG por `tools/w12-mapas.py` (centro/largura/altura de cada plataforma; tela de referência 390×844; prévias com as caixas
// em `_gemini_out/w5-arte-20261019/previas/w12-*-diag.png`). Plataformas medidas (px do PNG): Lab — Santuário 383/472 (265×175), Biblioteca 170/569, Amigos 590/566, Evolução 235/875,
// Arquivo 529/881, Perfil 383/1124; Hall — losangos de cima 196/428 e 586/427 (300×148), o de baixo 385/993 (508×246); Arena — DOIS retângulos: o de baixo-esquerda 500/810 (450×330)
// e o de cima-direita 755/650 (435×302): Torneio + Arena livre no da esquerda, Guerra de Clãs no da direita. Mercado: só o ajuste fino (os pés sobem 1 a 4 pontos; as linhas de cima e de
// baixo ficam ≥ 22 pontos separadas por causa do guard H11 — as plataformas distam só 18).
// W13 (20/10/2026, dono): o rótulo do lote encurtou para "Vínculo"/"Bond" e a Biblioteca e o Círculo de Amigos DESCERAM ao centro das plataformas deles (~43–44%; o Amigos 1 ponto acima do centro
// para o rótulo não tocar o Arquivo). Prévias: `w13-laboratorio*.png`.
const LABORATORIO_LOTS: AreaLotSpec<LaboratorioLotId>[] = [
  { id: 'evolucao', labelPt: 'Centro de Evolução', labelEn: 'Evolution Center', ariaPt: 'Entrar no Centro de Evolução', ariaEn: 'Enter the Evolution Center', left: '26.7%', top: '68.6%', width: '40%' },
  { id: 'pet', labelPt: 'Arquivo', labelEn: 'Archive', ariaPt: 'Entrar no Arquivo', ariaEn: 'Enter the Archive', left: '74%', top: '68.3%', width: '46%' },
  { id: 'stats', labelPt: 'Vínculo', labelEn: 'Bond', ariaPt: 'Entrar no Santuário do Vínculo (estatísticas)', ariaEn: 'Enter the Bond Sanctum (stats)', left: '50%', top: '38.2%', width: '64%' },
  // beta-2 (11, 13/10/2026): o PERFIL do Soulmon — embaixo, no meio do piso hexagonal livre entre o Centro de Evolução e o Arquivo (o Santuário segue grande e no alto).
  // D-44 (19/10/2026, dono): "só pode ser um pouco maior" — 36% → 41% (~+15%); o guard H11 (geometria dos lotes) segue verde nos 5 viewports.
  { id: 'perfil', labelPt: 'Perfil', labelEn: 'Profile', ariaPt: 'Entrar no Perfil do Soulmon', ariaEn: 'Enter the Soulmon Profile', left: '50.5%', top: '85.8%', width: '41%' },
  // D-50 (19/10/2026, dono): a Biblioteca e o Círculo de Amigos SAEM do Hall e vêm para o Laboratório. Ficam nos dois flancos do Santuário (que é estreito:
  // só ~32% da cena é opaca), à esquerda e à direita, num só andar. D-47: a Biblioteca aparece INTEIRA já na primeira tela, sem rolagem (a cena É a viewport) —
  // `areaLotGeometry.contract.test.ts` mede a caixa dela em 360×640. Larguras 32% (W5; antes 34%): com 36% a caixa encosta no Santuário (guard H11). Arte: a que já existe nos lotes.
  { id: 'biblioteca', labelPt: 'Biblioteca', labelEn: 'Library', ariaPt: 'Entrar na Biblioteca', ariaEn: 'Enter the Library', left: '16.2%', top: '44.4%', width: '32%' },
  { id: 'amigos', labelPt: 'Círculo de Amigos', labelEn: 'Friends Circle', ariaPt: 'Entrar no Círculo de Amigos', ariaEn: 'Enter the Friends Circle', left: '83.4%', top: '42.9%', width: '32%' },
];

// D-50 (19/10/2026, dono): o Hall fica com EXATAMENTE três prédios — Feira, Clan Hall (o administrativo do clã) e Grove — um por plataforma do fundo
// (dois losangos em cima, o grande embaixo). A Biblioteca e o Círculo de Amigos foram para o Laboratório (`LABORATORIO_LOTS`). A ordem do array é a ordem de pintura.
// O Grove tem arte própria desde W5 (19/10/2026): pavilhão de cristal em volta de uma árvore jovem.
const HALL_LOTS: AreaLotSpec<HallLotId>[] = [
  { id: 'feira', labelPt: GUILD_COPY['guild.lote.feira.label'][0], labelEn: GUILD_COPY['guild.lote.feira.label'][1], ariaPt: GUILD_COPY['guild.lote.feira.aria'][0], ariaEn: GUILD_COPY['guild.lote.feira.aria'][1], left: '20.4%', top: '32.9%', width: '58%' },
  { id: 'grove', labelPt: 'Grove', labelEn: 'Grove', ariaPt: 'Entrar no Grove', ariaEn: 'Enter the Grove', left: '79%', top: '33.3%', width: '50%' },
  { id: 'guilda', labelPt: GUILD_COPY['guild.lote.hall.label'][0], labelEn: GUILD_COPY['guild.lote.hall.label'][1], ariaPt: GUILD_COPY['guild.lote.hall.aria'][0], ariaEn: GUILD_COPY['guild.lote.hall.aria'][1], left: '50.8%', top: '75.2%', width: '64%' },
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
