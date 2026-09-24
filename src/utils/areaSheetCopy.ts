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
export type MercadoLotId = 'itens' | 'decoracao' | 'background' | 'conquistas';
export type ArenaLotId = 'torneio' | 'duelo';

interface AreaLotSpec<K extends string> {
  id: K;
  labelPt: string; labelEn: string;
  ariaPt: string; ariaEn: string;
  left: string; top: string;
}

const MERCADO_LOTS: AreaLotSpec<MercadoLotId>[] = [
  { id: 'itens', labelPt: 'Itens', labelEn: 'Items', ariaPt: 'Entrar na lojinha de Itens', ariaEn: 'Enter the Items stall', left: '26%', top: '33%' },
  { id: 'decoracao', labelPt: 'Decoração', labelEn: 'Decor', ariaPt: 'Entrar na lojinha de Decoração', ariaEn: 'Enter the Decor stall', left: '72%', top: '33%' },
  { id: 'background', labelPt: 'Background', labelEn: 'Background', ariaPt: 'Entrar na lojinha de Background', ariaEn: 'Enter the Background stall', left: '26%', top: '55%' },
  { id: 'conquistas', labelPt: 'Conquistas', labelEn: 'Achievements', ariaPt: 'Entrar em Conquistas', ariaEn: 'Enter Achievements', left: '72%', top: '55%' },
];

const ARENA_LOTS: AreaLotSpec<ArenaLotId>[] = [
  { id: 'torneio', labelPt: 'Torneio', labelEn: 'Tournament', ariaPt: 'Entrar no Torneio', ariaEn: 'Enter the Tournament', left: '27%', top: '55%' },
  { id: 'duelo', labelPt: 'Duelo', labelEn: 'Duel', ariaPt: 'Entrar no Duelo', ariaEn: 'Enter the Duel', left: '70%', top: '42%' },
];

function resolveLots<K extends string>(specs: AreaLotSpec<K>[], language: Language) {
  const isPt = language === 'pt-BR';
  return specs.map(s => ({
    id: s.id,
    label: isPt ? s.labelPt : s.labelEn,
    ariaLabel: isPt ? s.ariaPt : s.ariaEn,
    left: s.left, top: s.top,
  }));
}

export function mercadoLots(language: Language) { return resolveLots(MERCADO_LOTS, language); }
export function arenaLots(language: Language) { return resolveLots(ARENA_LOTS, language); }
