/**
 * NAVEGAÇÃO — duas telas de topo (Home e Mapa) e as áreas do Mapa.
 *
 * Arquitetura aprovada pelo dono em 23/09/2026 (`docs/design/minimal-ui/`): a
 * barra inferior de 5 abas SAIU. A Home tem um único link para o Mapa (canto
 * inferior direito); o Mapa tem um único link para a Home (canto inferior
 * esquerdo); cada área do Mapa abre a sua tela, com o voltar para o Mapa.
 *
 * As páginas do menu da Home (D6: Configurações, Oráculo; as Estatísticas saíram
 * em 02/10/2026 — G2 — e vivem só no Laboratório, no Santuário do Vínculo) são
 * `page:*` — voltam para a Home, não para o Mapa, porque é de lá que saem.
 *
 * O grafo de "voltar" mora AQUI, numa função pura (`viewBack`), e não espalhado
 * pelos handlers: é o mesmo grafo para o botão voltar da tela, para o voltar do
 * navegador (`popstate`) e para o botão físico do Android. Três cópias da regra
 * seriam três regras que divergem em silêncio (footgun 9).
 */

/** As sete áreas do Mapa, na ordem de leitura do Mapa (a Forja, #187 de 28/10/2026, fica embaixo da Exploração, ao lado do Laboratório). */
import { LISTED_QUEST_BUILDINGS } from './utils/buildingQuests';
import { currentBuildingId } from './utils/gates';

export const AREAS = ['mercado', 'jogos', 'arena', 'exploracao', 'forja', 'laboratorio', 'hall'] as const;
export type AreaId = typeof AREAS[number];

/** Páginas que saem do menu da Home (D6). */
export const MENU_PAGES = ['settings', 'oracle'] as const;
export type MenuPageId = typeof MENU_PAGES[number];

export type ViewType = 'home' | 'map' | `area:${AreaId}` | `page:${MenuPageId}`;

/**
 * O destino do "Ir lá" de um material na Mochila (`Mochila` → `App.handleMaterialGoTo`). A missão que o menu da Home lista
 * (`LISTED_QUEST_BUILDINGS`, o Caderno) mora SÓ no menu de Missões; qualquer outro prédio leva à área dele com a folha do lote
 * aberta (a visita conta como sempre; Vínculo e demo quem decide é o `AreaView`). `null` = prédio que não existe no mapa.
 */
export type BuildingDestination = { kind: 'missions' } | { kind: 'lot'; area: AreaId; lot: string; section?: string };

/**
 * Prédios que NÃO têm lote próprio no Mapa (#187, 28/10/2026): o id é estável (missão, material, peça do Soulsmith, save), mas a função
 * mora DENTRO de outro lote. `laboratorio.pet` (o Arquivo) é a seção "Arquivo" do Perfil; `laboratorio.amigos` (o Círculo de Amigos) é a
 * seção "Amigos" do Salão do Clã. Um atalho a esses ids abre o lote-casa já na seção.
 */
export const BUILDING_HOME: Readonly<Record<string, { area: AreaId; lot: string; section: string }>> = {
  'laboratorio.pet': { area: 'laboratorio', lot: 'perfil', section: 'arquivo' },
  'laboratorio.amigos': { area: 'hall', lot: 'guilda', section: 'amigos' },
};
/** Onde o prédio mora no Mapa hoje (área + lote [+ seção]), por qualquer id, antigo ou novo; `null` = não existe. Ignora o atalho das Missões. */
export function buildingLot(building: string): { area: AreaId; lot: string; section?: string } | null {
  // D-50: um atalho/link antigo (`hall.biblioteca`, `hall.amigos`) cai no prédio onde ele mora hoje (o Laboratório).
  const now = String(currentBuildingId(building));
  const home = BUILDING_HOME[now];
  if (home) return { area: home.area, lot: home.lot, section: home.section };
  const [area, lot] = now.split('.');
  if (!lot || !(AREAS as readonly string[]).includes(area)) return null;
  return { area: area as AreaId, lot };
}

export function buildingDestination(building: string): BuildingDestination | null {
  if ((LISTED_QUEST_BUILDINGS as readonly string[]).includes(String(currentBuildingId(building)))) return { kind: 'missions' };
  const l = buildingLot(building);
  return l ? { kind: 'lot', ...l } : null;
}

export function areaView(id: AreaId): ViewType {
  return `area:${id}`;
}

/** A área de uma view, ou `null` se ela não for uma área. */
export function areaOf(view: ViewType): AreaId | null {
  if (!view.startsWith('area:')) return null;
  const id = view.slice(5) as AreaId;
  return (AREAS as readonly string[]).includes(id) ? id : null;
}

export function menuPageOf(view: ViewType): MenuPageId | null {
  if (!view.startsWith('page:')) return null;
  const id = view.slice(5) as MenuPageId;
  return (MENU_PAGES as readonly string[]).includes(id) ? id : null;
}

/**
 * Para onde o "voltar" leva: área → Mapa → Home; página do menu → Home.
 * `null` na Home — ali o voltar é do sistema (sair do app), não nosso.
 */
export function viewBack(view: ViewType): ViewType | null {
  if (view === 'home') return null;
  if (view === 'map') return 'home';
  if (areaOf(view)) return 'map';
  return 'home';
}

/** Nome da área, nos dois idiomas (inglês é a base). */
export function areaLabel(id: AreaId, isPt: boolean): string {
  switch (id) {
    case 'mercado': return isPt ? 'Mercado' : 'Market';
    case 'jogos': return isPt ? 'Jogos' : 'Games';
    case 'arena': return 'Arena';
    case 'exploracao': return isPt ? 'Exploração' : 'Exploration';
    case 'forja': return isPt ? 'A Forja' : 'The Forge';
    case 'laboratorio': return isPt ? 'Laboratório' : 'Laboratory';
    case 'hall': return 'Hall';
  }
}

/** Uma linha que diz o que há dentro — o Mapa ainda não tem a arte (F3). */
export function areaHint(id: AreaId, isPt: boolean): string {
  switch (id) {
    case 'mercado': return isPt ? 'Itens, decoração e fundos' : 'Items, decor and backgrounds';
    case 'jogos': return isPt ? 'Jogos livres, mente e refúgio' : 'Free play, mind and refuge';
    case 'arena': return isPt ? 'Torneio, Arena livre e Guerra' : 'Tournament, Open Arena and Clan War';
    case 'exploracao': return isPt ? 'Passeio, Fenda e Calabouço' : 'Stroll, Endless Rift and Dungeon';
    case 'forja': return isPt ? 'Foco, Caderno, Refúgio e Soulsmith' : 'Focus, Journal, Refuge and Soulsmith';
    case 'laboratorio': return isPt ? 'Evolução, Vínculo, Biblioteca e Perfil' : 'Evolution, Bond, Library and Profile';
    case 'hall': return isPt ? 'Feira, Clan Hall (e amigos) e Grove' : 'Fair, Clan Hall (and friends) and Grove';
  }
}

export function menuPageLabel(id: MenuPageId, isPt: boolean): string {
  switch (id) {
    case 'settings': return isPt ? 'Configurações' : 'Settings';
    case 'oracle': return isPt ? 'Oráculo' : 'Oracle';
  }
}
