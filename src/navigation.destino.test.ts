/**
 * O "Ir lá" do material na Mochila: para onde cada um dos 16 materiais leva (`buildingDestination`).
 * Regra: a missão listada no menu da Home (Caderno) abre o menu de Missões; qualquer outro prédio abre a folha do lote na área dele.
 */
import { describe, it, expect } from 'vitest';
import { buildingDestination, buildingLot, BUILDING_HOME, AREAS } from './navigation';
import { MATERIAL_BUILDING } from './utils/buildingQuests';

describe('buildingDestination', () => {
  it('tinta (Caderno) vai ao menu de Missões; os outros 15 abrem o lote na área do prédio', () => {
    expect(buildingDestination(MATERIAL_BUILDING.ink)).toEqual({ kind: 'missions' });
    for (const [mat, b] of Object.entries(MATERIAL_BUILDING)) {
      if (mat === 'ink') continue;
      const d = buildingDestination(b);
      expect(d?.kind, mat).toBe('lot');
      if (d?.kind === 'lot') {
        expect(AREAS).toContain(d.area);
        // #186: `laboratorio.pet` e `laboratorio.amigos` não têm lote próprio — moram dentro do Perfil e do Salão do Clã (`BUILDING_HOME`).
        if (b in BUILDING_HOME) expect({ area: d.area, lot: d.lot, section: d.section }).toEqual(BUILDING_HOME[b]);
        else expect(`${d.area}.${d.lot}`).toBe(b);
      }
    }
  });
  it('#186: atalhos antigos levam ao lote onde a função mora hoje (id antigo ou novo)', () => {
    expect(buildingDestination('laboratorio.pet')).toEqual({ kind: 'lot', area: 'laboratorio', lot: 'perfil', section: 'arquivo' });
    expect(buildingDestination('laboratorio.amigos')).toEqual({ kind: 'lot', area: 'hall', lot: 'guilda', section: 'amigos' });
    expect(buildingDestination('hall.amigos')).toEqual({ kind: 'lot', area: 'hall', lot: 'guilda', section: 'amigos' });
    expect(buildingDestination('exploracao.oficina')).toEqual({ kind: 'lot', area: 'forja', lot: 'oficina' });
    expect(buildingDestination('mercado.ferreiro')).toEqual({ kind: 'lot', area: 'forja', lot: 'ferreiro' });
    expect(buildingDestination('arena.fenda')).toEqual({ kind: 'lot', area: 'exploracao', lot: 'fenda' });
    expect(buildingDestination('jogos.dungeon')).toEqual({ kind: 'lot', area: 'exploracao', lot: 'dungeon' });
    expect(buildingDestination('exploracao.caderno')).toEqual({ kind: 'missions' }); // o Caderno (forja.caderno) segue listado no menu de Missões
    expect(buildingLot('exploracao.caderno')).toEqual({ area: 'forja', lot: 'caderno' }); // e o atalho da linha de missão abre o lote
  });
  it('lixo não leva a lugar nenhum', () => {
    expect(buildingDestination('nada')).toBeNull();
    expect(buildingDestination('mapa.x')).toBeNull();
  });
});
