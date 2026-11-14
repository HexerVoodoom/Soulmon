import { describe, it, expect } from 'vitest';
import {
  ARENA_CLEAR_BONUS_MATERIAL, ARENA_CLEAR_BONUS_PER_DAY, ARENA_CLEAR_BONUS_QTY, applyArenaClearBonus, arenaClearBonusDue,
  type ArenaClearBonusState,
} from './arenaClearBonus';
import { arenaClearBonusRows } from './arenaClearBonusCopy';
import { MATERIAL_BUILDING, MATERIAL_CAP } from './buildingQuests';
import { bumpDaily } from './dailyMissions';

const DIA = 'Sat Nov 14 2026';

// §372 (dono, 14/11/2026): "Derrotar todos na Arena concede bônus no prêmio" → +1 material (a Presa), 1×/dia, fora dos Bits.
describe('bônus "Todos derrotados" da Arena', () => {
  it('é +1 Presa, o material do próprio Duelo, uma vez por dia', () => {
    expect(ARENA_CLEAR_BONUS_MATERIAL).toBe('fang');
    expect(MATERIAL_BUILDING[ARENA_CLEAR_BONUS_MATERIAL]).toBe('arena.duelo');
    expect(ARENA_CLEAR_BONUS_QTY).toBe(1);
    expect(ARENA_CLEAR_BONUS_PER_DAY).toBe(1);
  });

  it('a 1ª run vencida do dia paga +1 Presa; não toca Bits nem Honra', () => {
    const prev = { gamePoints: 40, emblems: 7, dailyMissions: undefined, buildingQuests: { day: DIA, visited: [], claimed: [], materials: { fang: 2 } } };
    const { state, paid } = applyArenaClearBonus(prev, DIA);
    expect(paid).toBe(1);
    expect(state.buildingQuests.materials.fang).toBe(3);
    expect(state.gamePoints).toBe(40);
    expect(state.emblems).toBe(7);
  });

  it('save sem `buildingQuests` também recebe (estoque nasce em 1)', () => {
    const vazio: ArenaClearBonusState = {};
    const { state, paid } = applyArenaClearBonus(vazio, DIA);
    expect(paid).toBe(1);
    expect(state.buildingQuests?.materials.fang).toBe(1);
  });

  it('anti-farm: depois da 1ª vitória do dia (evento "arena" já contado) não paga de novo e devolve o MESMO prev', () => {
    const prev = { dailyMissions: bumpDaily(undefined, DIA, 'arena'), buildingQuests: { day: DIA, visited: [], claimed: [], materials: { fang: 3 } } };
    expect(arenaClearBonusDue(prev, DIA)).toBe(0);
    const r = applyArenaClearBonus(prev, DIA);
    expect(r.paid).toBe(0);
    expect(r.state).toBe(prev);
  });

  it('a contagem de ONTEM não trava hoje', () => {
    const prev = { dailyMissions: bumpDaily(undefined, 'Fri Nov 13 2026', 'arena', 4) };
    expect(arenaClearBonusDue(prev, DIA)).toBe(1);
  });

  it('estoque no teto (99): não paga e não promete linha', () => {
    const prev = { buildingQuests: { day: DIA, visited: [], claimed: [], materials: { fang: MATERIAL_CAP } } };
    expect(applyArenaClearBonus(prev, DIA)).toEqual({ state: prev, paid: 0 });
    expect(arenaClearBonusRows(0, true)).toEqual([]);
  });

  it('a linha do "Ganhou" é própria e bilíngue', () => {
    const [pt] = arenaClearBonusRows(1, true);
    const [en] = arenaClearBonusRows(1, false);
    expect(pt.kind).toBe('item');
    expect(pt.label).toBe('Todos derrotados +1 Presa');
    expect(en.label).toBe('All defeated +1 Fang');
  });
});
