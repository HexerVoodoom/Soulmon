/**
 * O "Ir lá" do material na Mochila: para onde cada um dos 16 materiais leva (`buildingDestination`).
 * Regra: a missão listada no menu da Home abre o menu de Missões (hoje nenhuma: o Caderno diário saiu em 12/11/2026); qualquer prédio abre a folha do lote na área dele.
 */
import { describe, it, expect } from 'vitest';
import { buildingDestination, buildingLot, BUILDING_HOME, AREAS } from './navigation';
import { MATERIAL_BUILDING } from './utils/buildingQuests';

describe('buildingDestination', () => {
  it('todo material leva ao lote do prédio (a tinta também: o Caderno não é mais listado no menu de Missões)', () => {
    expect(buildingDestination(MATERIAL_BUILDING.ink)).toEqual({ kind: 'lot', area: 'forja', lot: 'caderno' });
    for (const [mat, b] of Object.entries(MATERIAL_BUILDING)) {
      const d = buildingDestination(b);
      expect(d?.kind, mat).toBe('lot');
      if (d?.kind === 'lot') {
        expect(AREAS).toContain(d.area);
        // #187: `laboratorio.pet` e `laboratorio.amigos` não têm lote próprio — moram dentro do Perfil e do Salão do Clã (`BUILDING_HOME`).
        if (b in BUILDING_HOME) expect({ area: d.area, lot: d.lot, section: d.section }).toEqual(BUILDING_HOME[b]);
        else expect(`${d.area}.${d.lot}`).toBe(b);
      }
    }
  });
  it('#187: atalhos antigos levam ao lote onde a função mora hoje (id antigo ou novo)', () => {
    expect(buildingDestination('laboratorio.pet')).toEqual({ kind: 'lot', area: 'laboratorio', lot: 'perfil', section: 'arquivo' });
    expect(buildingDestination('laboratorio.amigos')).toEqual({ kind: 'lot', area: 'hall', lot: 'guilda', section: 'amigos' });
    expect(buildingDestination('hall.amigos')).toEqual({ kind: 'lot', area: 'hall', lot: 'guilda', section: 'amigos' });
    expect(buildingDestination('exploracao.oficina')).toEqual({ kind: 'lot', area: 'forja', lot: 'oficina' });
    expect(buildingDestination('mercado.ferreiro')).toEqual({ kind: 'lot', area: 'forja', lot: 'ferreiro' });
    expect(buildingDestination('arena.fenda')).toEqual({ kind: 'lot', area: 'exploracao', lot: 'fenda' });
    expect(buildingDestination('jogos.dungeon')).toEqual({ kind: 'lot', area: 'exploracao', lot: 'dungeon' });
    expect(buildingDestination('exploracao.caderno')).toEqual({ kind: 'lot', area: 'forja', lot: 'caderno' }); // o Caderno (forja.caderno) abre o lote
    expect(buildingLot('exploracao.caderno')).toEqual({ area: 'forja', lot: 'caderno' }); // e o atalho da linha de missão abre o lote
  });
  it('lixo não leva a lugar nenhum', () => {
    expect(buildingDestination('nada')).toBeNull();
    expect(buildingDestination('mapa.x')).toBeNull();
  });
});
