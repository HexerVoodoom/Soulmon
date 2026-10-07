import { describe, it, expect } from 'vitest';
import * as srv from './_buildingQuests.js';
import { MATERIAL_IDS, MATERIAL_CAP, sanitizeBuildingQuests, QUEST_BUILDINGS } from '../../src/utils/buildingQuests';

describe('missao por predio: servidor e app concordam', () => {
  it('mesma lista fechada de materiais e mesmo teto', () => {
    expect(srv.MATERIAL_IDS).toEqual([...MATERIAL_IDS]);
    expect(srv.MATERIAL_CAP).toBe(MATERIAL_CAP);
  });
  it('a saneacao bate em entradas boas e hostis', () => {
    const casos = [
      null, 3, 'x', [], {}, { day: '' }, { day: 'Wed Oct 07 2026' },
      { day: 'd', visited: [...QUEST_BUILDINGS, 'mercado.itens', 'x'], claimed: ['hall.guilda', 'hall.guilda'], materials: { ore: 500, spark: 2.7, nope: 1, gear: -1, page: 'a' } },
    ];
    for (const c of casos) expect(srv.sanitizeBuildingQuests(c), JSON.stringify(c)).toEqual(sanitizeBuildingQuests(c));
  });
});
