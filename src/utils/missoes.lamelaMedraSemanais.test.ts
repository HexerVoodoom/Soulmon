import { describe, it, expect } from 'vitest';
import { weeklyMissionPool, weeklyMissionsFor, isWeeklyDone } from './weeklyMissions';
import { weeklyTarget } from './missionTargets';
import { NPCS_SEM_MISSAO } from './npcMissions';
import { countWeeklyMission } from './dungeonRewards';
import { readFileSync } from 'node:fs';

// 22/11/2026 (dono, REGISTRO §493): Lamela (Itens) e Medra (Conquistas) têm missão SEMANAL.
const app = readFileSync('src/App.tsx', 'utf8');
const now = new Date('2026-11-17T12:00:00Z');

describe('Lamela e Medra: semanais do Mercado', () => {
  it('existem no pool com texto que nomeia a lojinha, e explicam a ausência da diária', () => {
    const pool = weeklyMissionPool();
    const i = pool.find(m => m.id === 'buy-item')!;
    const c = pool.find(m => m.id === 'claim-achievement')!;
    expect(i).toMatchObject({ target: 2, emblems: 3 });
    expect(c).toMatchObject({ target: 1, emblems: 3 });
    for (const m of [i, c]) expect(`${m.descPt} ${m.descEn}`).not.toMatch(/Mercado|Market/);
    expect(NPCS_SEM_MISSAO['mercado:itens']).toMatch(/buy-item/);
    expect(NPCS_SEM_MISSAO['mercado:conquistas']).toMatch(/claim-achievement/);
  });
  it('o "Ir" leva à lojinha certa', () => {
    expect(weeklyTarget('buy-item')).toBe('mercado.itens');
    expect(weeklyTarget('claim-achievement')).toBe('mercado.conquistas');
  });
  it('contam e fecham no alvo; entram no sorteio sem duplicar', () => {
    let s = countWeeklyMission({ weeklyMissions: undefined, playerDayTz: undefined }, 'buy-item', now);
    expect(isWeeklyDone(s.weeklyMissions!, weeklyMissionPool().find(m => m.id === 'buy-item')!)).toBe(false);
    s = countWeeklyMission(s, 'buy-item', now);
    expect(isWeeklyDone(s.weeklyMissions!, weeklyMissionPool().find(m => m.id === 'buy-item')!)).toBe(true);
    for (const id of ['buy-item', 'claim-achievement']) {
      let n = 0;
      for (let k = 0; k < 400; k += 1) {
        const l = weeklyMissionsFor(`2026-W${k}`).map(m => m.id);
        expect(new Set(l).size).toBe(l.length);
        if (l.includes(id as never)) n += 1;
      }
      expect(n / 400, id).toBeGreaterThan(0.1);
    }
  });
  it('o App conta a compra de item e o resgate de conquista', () => {
    expect(app).toContain("countWeeklyMission(comprou, 'buy-item'");
    expect(app).toContain("countWeeklyMission(resgatou, 'claim-achievement'");
  });
});
