import { describe, expect, it } from 'vitest';
import { missionsDoneFirst, type MissionRankState } from './missionOrder';

describe('missionsDoneFirst (A5)', () => {
  const st: Record<string, MissionRankState> = { a: 'open', b: 'ready', c: 'claimed', d: 'open', e: 'ready' };
  it('prontas, depois concluídas, depois abertas; estável dentro do grupo', () => {
    expect(missionsDoneFirst(['a', 'b', 'c', 'd', 'e'], x => st[x])).toEqual(['b', 'e', 'c', 'a', 'd']);
  });
  it('não muta a entrada', () => {
    const e = ['a', 'b'];
    missionsDoneFirst(e, x => st[x]);
    expect(e).toEqual(['a', 'b']);
  });
});
