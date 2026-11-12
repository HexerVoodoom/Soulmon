import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { weeklyMissionsFor, weeklyMissionPool, bumpWeeklyDay, claimWeekly, isWeeklyDone, WEEKLY_MISSION_COUNT, type WeeklyMissionProgress } from './weeklyMissions';
import { countWeeklyMission } from './dungeonRewards';
import { weeklyTarget } from './missionTargets';
import { dailyMissionPool } from './dailyMissions';
import { buildingLot } from '../navigation';

const app = readFileSync('src/App.tsx', 'utf8');

describe('journal e Focus Workshop são semanais 3x, nunca diárias', () => {
  it('sempre na lista da semana, qualquer semana', () => {
    for (let w = 1; w <= 52; w += 1) {
      const ids = weeklyMissionsFor(`2026-W${String(w).padStart(2, '0')}`).map(m => m.id);
      expect(ids).toContain('journal-days');
      expect(ids).toContain('focus-days');
      expect(ids.length).toBe(WEEKLY_MISSION_COUNT + 2);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('alvo 3, Emblemas como as outras de alvo 3, tocar leva ao Caderno / à Oficina', () => {
    for (const id of ['journal-days', 'focus-days'] as const) {
      const m = weeklyMissionPool().find(x => x.id === id)!;
      expect(m.target).toBe(3);
      expect(m.emblems).toBe(3);
      expect(buildingLot(weeklyTarget(id) as string)).not.toBeNull();
    }
    expect(weeklyTarget('journal-days')).toBe('forja.caderno');
    expect(weeklyTarget('focus-days')).toBe('forja.oficina');
  });
  it('no máximo 1 por dia; 3 dias fecham; resgate paga uma vez', () => {
    let p: WeeklyMissionProgress = { week: '2026-W46', counts: {}, claimed: [] };
    p = bumpWeeklyDay(p, 'journal-days', '2026-11-09');
    expect(bumpWeeklyDay(p, 'journal-days', '2026-11-09')).toBe(p);
    p = bumpWeeklyDay(p, 'journal-days', '2026-11-10');
    p = bumpWeeklyDay(p, 'journal-days', '2026-11-11');
    expect(p.counts['journal-days']).toBe(3);
    const m = weeklyMissionPool().find(x => x.id === 'journal-days')!;
    expect(isWeeklyDone(p, m)).toBe(true);
    const a = claimWeekly(p, m);
    expect(a.emblems).toBe(3);
    expect(claimWeekly(a.progress, m).emblems).toBe(0);
  });
  it('countWeeklyMission aplica o limite diário no estado do jogo', () => {
    const t = new Date('2026-11-11T15:00:00Z');
    let s = countWeeklyMission({ weeklyMissions: undefined, playerDayTz: undefined } as never, 'focus-days', t) as { weeklyMissions: WeeklyMissionProgress };
    const s2 = countWeeklyMission(s as never, 'focus-days', t) as { weeklyMissions: WeeklyMissionProgress };
    expect(s2.weeklyMissions.counts['focus-days']).toBe(1);
    s = countWeeklyMission(s as never, 'focus-days', new Date('2026-11-12T15:00:00Z')) as never;
    expect(s.weeklyMissions.counts['focus-days']).toBe(2);
  });
  it('fiação: salvar entrada do journal e concluir sessão do foco contam; as diárias saíram', () => {
    // o Caderno conta na diária do Trilho; a semanal de journal anda no RESGATE dela (REGISTRO §318)
    expect(app).toContain("bumpDailyIn(prev, 'journal')");
    expect(app).toContain("countWeeklyMission(r.state, 'journal-days'");
    expect(app).toContain("countWeeklyMission(prev, 'focus-days'");
    expect(dailyMissionPool().some(m => m.id === 'd-foco')).toBe(false);
  });
});
