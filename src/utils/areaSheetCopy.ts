/**
 * COPY DO LOTE DE EXEMPLO por área (minimal-ui F4).
 *
 * F4 é só o MOLDE: um `.lote` de exemplo por área abrindo um `AreaSheet` com
 * placeholder — o conteúdo completo (abas por moeda, listas, jogos) é F5
 * (`docs/design/minimal-ui/PLANO-IMPLEMENTACAO.md`). Dono único desta copy,
 * para nenhum componente escrever texto de UI solto dentro do JSX.
 */
import type { Language } from './i18n';
import type { AreaId } from '../navigation';

interface AreaDemoLotCopy {
  labelPt: string;
  labelEn: string;
  placeholderPt: string;
  placeholderEn: string;
}

const AREA_DEMO_LOT: Record<AreaId, AreaDemoLotCopy> = {
  mercado: {
    labelPt: 'Itens', labelEn: 'Items',
    placeholderPt: 'A lojinha de Itens chega na próxima fatia — aqui é só o molde da folha.',
    placeholderEn: "The Items stall arrives in the next slice — this is just the sheet's shape.",
  },
  jogos: {
    labelPt: 'Duelo', labelEn: 'Duel',
    placeholderPt: 'O Pedra-papel-tesoura chega na próxima fatia — aqui é só o molde da folha.',
    placeholderEn: "Rock-paper-scissors arrives in the next slice — this is just the sheet's shape.",
  },
  arena: {
    labelPt: 'Torneio', labelEn: 'Tournament',
    placeholderPt: 'O Torneio chega na próxima fatia — aqui é só o molde da folha.',
    placeholderEn: "The Tournament arrives in the next slice — this is just the sheet's shape.",
  },
  exploracao: {
    labelPt: 'Masmorra', labelEn: 'Dungeon',
    placeholderPt: 'A Masmorra chega na próxima fatia — aqui é só o molde da folha.',
    placeholderEn: "The Dungeon arrives in the next slice — this is just the sheet's shape.",
  },
  laboratorio: {
    labelPt: 'Evolução', labelEn: 'Evolution',
    placeholderPt: 'A Evolução chega na próxima fatia — aqui é só o molde da folha.',
    placeholderEn: "Evolution arrives in the next slice — this is just the sheet's shape.",
  },
  hall: {
    labelPt: 'Biblioteca', labelEn: 'Library',
    placeholderPt: 'A Biblioteca chega na próxima fatia — aqui é só o molde da folha.',
    placeholderEn: "The Library arrives in the next slice — this is just the sheet's shape.",
  },
};

export function areaDemoLot(id: AreaId, language: Language): { label: string; placeholder: string } {
  const c = AREA_DEMO_LOT[id];
  const isPt = language === 'pt-BR';
  return { label: isPt ? c.labelPt : c.labelEn, placeholder: isPt ? c.placeholderPt : c.placeholderEn };
}
