import { describe, it, expect } from 'vitest';
import * as gates from './_gates.js';
import * as bq from './_buildingQuests.js';
import * as dm from './_dailyMissions.js';
import { MOVED_BUILDINGS } from '../../src/utils/gates';
import { sanitizeBuildingQuests } from '../../src/utils/buildingQuests';
import { sanitizeFirstTimes, FIRST_TIME_IDS } from '../../src/utils/dailyMissions';

// D-50 (19/10/2026): Biblioteca e Amigos mudaram do Hall para o Laboratorio; o servidor migra o save antigo como o app.
describe('D-50: migracao de ids de predio igual nos dois lados', () => {
  it('mesma tabela de ids movidos e mesma lista de primeiras vezes', () => {
    expect(gates.MOVED_BUILDINGS).toEqual(MOVED_BUILDINGS);
    expect(dm.FIRST_TIME_IDS).toEqual([...FIRST_TIME_IDS]);
  });
  it('um save antigo sai igual do app e do servidor, e a 2a rodada e no-op', () => {
    const q = { day: 'd', visited: ['hall.biblioteca', 'hall.guilda'], claimed: ['hall.amigos'], materials: { page: 3, keepsake: 1 } };
    const a = bq.sanitizeBuildingQuests(q);
    expect(a).toEqual(sanitizeBuildingQuests(q));
    expect(bq.sanitizeBuildingQuests(JSON.parse(JSON.stringify(a)))).toEqual(a);
    expect(a.visited).toContain('laboratorio.biblioteca');
    const f = { done: ['visit:hall.biblioteca'], claimed: ['visit:hall.amigos'] };
    const b = dm.sanitizeFirstTimes(f);
    expect(b).toEqual(sanitizeFirstTimes(f));
    expect(dm.sanitizeFirstTimes(JSON.parse(JSON.stringify(b)))).toEqual(b);
    expect(b.claimed).toEqual(['visit:laboratorio.amigos']);
  });
});
