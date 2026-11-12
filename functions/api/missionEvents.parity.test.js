import { describe, it, expect } from 'vitest';
import * as srv from './_missionEvents.js';
import { weeklyMissionPool, WEEKLY_ONCE_PER_DAY, WEEKLY_FIXED } from '../../src/utils/weeklyMissions';
import { dailyMissionPool } from '../../src/utils/dailyMissions';
import { isoWeekKey } from '../../src/utils/offerMoment';
import { playerDayKey } from '../../src/utils/playerDay';

describe('missoes validadas: servidor e app concordam', () => {
  it('mesmos ids e alvos das semanais validadas', () => {
    for (const [id, v] of Object.entries(srv.WEEKLY_VALIDATED)) {
      const m = weeklyMissionPool().find(x => x.id === id);
      expect(m, id).toBeDefined();
      expect(v.target, id).toBe(m.target);
    }
    expect(Object.keys(srv.WEEKLY_VALIDATED).sort()).toEqual(['focus-days', 'gift-sent', 'journal-days']);
  });
  it('journal e foco sao as de 1 contagem por dia (o razao e uma lista de dias)', () => {
    for (const [id, v] of Object.entries(srv.WEEKLY_VALIDATED)) {
      if (v.kind === 'j' || v.kind === 'f') expect(WEEKLY_ONCE_PER_DAY.includes(id), id).toBe(true);
    }
    expect([...WEEKLY_FIXED].sort()).toEqual(['focus-days', 'journal-days']);
  });
  it('a diaria validada existe com o mesmo evento e alvo', () => {
    const d = dailyMissionPool().find(m => m.id === srv.DAILY_VALIDATED.id);
    expect(d.event).toBe(srv.DAILY_VALIDATED.event);
    expect(d.target).toBe(srv.DAILY_VALIDATED.target);
  });
  it('as missoes de NPC que contam presente existem com o mesmo evento e alvo (Zumi, Papus)', () => {
    for (const v of srv.DAILY_VALIDATED_EXTRA) {
      const d = dailyMissionPool().find(m => m.id === v.id);
      expect(d.event, v.id).toBe(v.event);
      expect(d.target, v.id).toBe(v.target);
    }
    // toda missao de NPC com evento `presente` esta na lista validada
    const ids = dailyMissionPool().filter(m => m.event === 'presente').map(m => m.id).sort();
    expect(ids).toEqual([srv.DAILY_VALIDATED.id, ...srv.DAILY_VALIDATED_EXTRA.map(v => v.id)].sort());
  });
  it('a chave legada friend-visit e a que o app migra para gift-sent', () => {
    expect(srv.LEGACY_WEEKLY).toBe('friend-visit');
  });
  it('semana ISO: mesma resposta do app, ano inteiro (virada de ano incluida)', () => {
    for (let t = Date.UTC(2025, 11, 20); t < Date.UTC(2027, 0, 12); t += 86_400_000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      expect(srv.isoWeekOf(iso), iso).toBe(isoWeekKey(iso));
    }
  });
  it('o dia do jogador (toDateString) vira o mesmo dia ISO e a mesma semana que o app calcula', () => {
    for (const d of ['2026-11-09T12:00:00Z', '2026-11-15T23:30:00Z', '2026-12-31T12:00:00Z', '2027-01-03T12:00:00Z']) {
      const chave = playerDayKey(new Date(d), undefined);
      const iso = srv.toIsoDay(chave);
      expect(srv.isoWeekOf(iso)).toBe(isoWeekKey(chave));
    }
  });
});
