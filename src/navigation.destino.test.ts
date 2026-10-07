/**
 * O "Ir lá" do material na Mochila: para onde cada um dos 16 materiais leva (`buildingDestination`).
 * Regra: a missão listada no menu da Home (Caderno) abre o menu de Missões; qualquer outro prédio abre a folha do lote na área dele.
 */
import { describe, it, expect } from 'vitest';
import { buildingDestination, AREAS } from './navigation';
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
        expect(`${d.area}.${d.lot}`).toBe(b);
      }
    }
  });
  it('lixo não leva a lugar nenhum', () => {
    expect(buildingDestination('nada')).toBeNull();
    expect(buildingDestination('mapa.x')).toBeNull();
  });
});
