import { describe, expect, it } from 'vitest';
import { boardHasDivider, layoutMissionBoard, missionsInQueueOrder, type MissionRankState } from './missionOrder';

describe('missionsInQueueOrder (revisão 20/10/2026)', () => {
  const st: Record<string, MissionRankState> = { a: 'open', b: 'ready', c: 'claimed', d: 'open', e: 'ready' };
  it('prontas, depois abertas, depois resgatadas no fim', () => {
    expect(missionsInQueueOrder(['a', 'b', 'c', 'd', 'e'], x => st[x])).toEqual(['b', 'e', 'a', 'd', 'c']);
  });
  it('estável dentro do grupo', () => {
    expect(missionsInQueueOrder(['d', 'a', 'e', 'b'], x => st[x])).toEqual(['e', 'b', 'd', 'a']);
  });
  it('não muta a entrada', () => {
    const e = ['c', 'a', 'b'];
    missionsInQueueOrder(e, x => st[x]);
    expect(e).toEqual(['c', 'a', 'b']);
  });
});

describe('layoutMissionBoard', () => {
  const st: Record<string, MissionRankState> = { sp: 'open', n1: 'open', n2: 'ready', n3: 'claimed', n4: 'open' };
  const isSp = (x: string) => x === 'sp';
  const lay = (items: string[], s = st) => layoutMissionBoard(items, x => s[x], isSp);

  it('especial aberta fica no topo; ready normal acima de open; claimed no fim', () => {
    const l = lay(['n3', 'n1', 'sp', 'n2', 'n4']);
    expect(l.top).toEqual(['sp']);
    expect(l.rest).toEqual(['n2', 'n1', 'n4', 'n3']);
    expect(l.divider).toBe(true);
  });
  it('especial concluída vai ao fim, entre as concluídas, sem divisor no topo', () => {
    const l = lay(['sp', 'n1', 'n3', 'n2'], { ...st, sp: 'claimed' });
    expect(l.top).toEqual([]);
    expect(l.rest).toEqual(['n2', 'n1', 'sp', 'n3']);
    expect(l.divider).toBe(false);
  });
  it('sem especial = sem divisor', () => {
    const l = lay(['n1', 'n2']);
    expect(l.top).toEqual([]);
    expect(l.divider).toBe(false);
  });
  it('só especial = sem divisor', () => {
    const l = lay(['sp']);
    expect(l.top).toEqual(['sp']);
    expect(l.rest).toEqual([]);
    expect(l.divider).toBe(false);
    expect(boardHasDivider(l)).toBe(false);
    expect(boardHasDivider({ top: [1], rest: [2] })).toBe(true);
  });
  it('não muta a entrada', () => {
    const e = ['n3', 'sp', 'n2'];
    lay(e);
    expect(e).toEqual(['n3', 'sp', 'n2']);
  });
});
