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

/** As seis áreas do Mapa, na ordem de leitura do Mapa. */
import { LISTED_QUEST_BUILDINGS } from './utils/buildingQuests';

export const AREAS = ['mercado', 'jogos', 'arena', 'exploracao', 'laboratorio', 'hall'] as const;
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
export type BuildingDestination = { kind: 'missions' } | { kind: 'lot'; area: AreaId; lot: string };
export function buildingDestination(building: string): BuildingDestination | null {
  if ((LISTED_QUEST_BUILDINGS as readonly string[]).includes(building)) return { kind: 'missions' };
  const [area, lot] = building.split('.');
  if (!lot || !(AREAS as readonly string[]).includes(area)) return null;
  return { kind: 'lot', area: area as AreaId, lot };
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
    case 'laboratorio': return isPt ? 'Laboratório' : 'Laboratory';
    case 'hall': return 'Hall';
  }
}

/** Uma linha que diz o que há dentro — o Mapa ainda não tem a arte (F3). */
export function areaHint(id: AreaId, isPt: boolean): string {
  switch (id) {
    case 'mercado': return isPt ? 'Itens, decoração e fundos' : 'Items, decor and backgrounds';
    case 'jogos': return isPt ? 'Jogos livres, mente e refúgio' : 'Free play, mind and refuge';
    case 'arena': return isPt ? 'Torneio da semana' : "This week's tournament";
    case 'exploracao': return isPt ? 'Masmorra, Passeio, Oficina e Caderno' : 'Dungeon, Stroll, Workshop and Journal';
    case 'laboratorio': return isPt ? 'Evolução do seu Soulmon' : "Your Soulmon's evolution";
    case 'hall': return isPt ? 'Biblioteca e outros jogadores' : 'Library and other players';
  }
}

export function menuPageLabel(id: MenuPageId, isPt: boolean): string {
  switch (id) {
    case 'settings': return isPt ? 'Configurações' : 'Settings';
    case 'oracle': return isPt ? 'Oráculo' : 'Oracle';
  }
}
