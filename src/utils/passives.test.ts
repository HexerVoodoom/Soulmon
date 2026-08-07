import { describe, it, expect } from 'vitest';
import {
  PET_PASSIVES, rollPetPassive, getPassive, hasPassive,
  rubDailyCap, heartLossCap, heartDropBonus, earliestPoopHour,
} from './passives';
import { feedFood, rubHeal, RUB_HEAL_DAILY_CAP, type CareState } from './careRules';
import { computeDailyReset, MAX_HEARTS_LOST_PER_DAY } from './dailyReset';

const WEDNESDAY = new Date('2026-08-05T12:00:00');

const careBase = (): CareState => ({
  healthPoints: 1,
  maxHealthPoints: 3,
  energyPoints: 0,
  evolutionStage: 'rookie',
  foodInventory: { '🍎': 5 },
  virusPoints: 0,
  dataPoints: 0,
  vaccinePoints: 0,
  totalXP: 0,
  attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
});

const resetBase = () => ({
  activities: [], tasks: [],
  healthPoints: 3, maxHealthPoints: 3, energyPoints: 10,
  perfectDays: 0, totalXP: 0, virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'],
  degeneratedByHP: false, currentBranch: 'data' as const, lastDayWasPerfect: false,
  maxActivityCap: 6,
  attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
  lastResetDate: new Date('2026-08-04T12:00:00').toDateString(),
});

describe('passives — catálogo', () => {
  it('todo traço tem id único e textos nos dois idiomas', () => {
    const ids = PET_PASSIVES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PET_PASSIVES) {
      expect(p.namePt).toBeTruthy();
      expect(p.nameEn).toBeTruthy();
      expect(p.descPt).toBeTruthy();
      expect(p.descEn).toBeTruthy();
      expect(p.emoji).toBeTruthy();
    }
  });

  it('o sorteio sempre devolve um id do catálogo', () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(PET_PASSIVES.map(p => p.id)).toContain(rollPetPassive(() => r));
    }
  });

  it('save antigo sem traço não quebra nada', () => {
    expect(getPassive(undefined)).toBeUndefined();
    expect(hasPassive(undefined, 'guloso')).toBe(false);
    expect(rubDailyCap(undefined, 1)).toBe(1);
    expect(heartLossCap(undefined, 1)).toBe(1);
    expect(heartDropBonus(undefined)).toBe(0);
    expect(earliestPoopHour(undefined, 7)).toBe(7);
  });

  it('nenhum traço é uma desvantagem', () => {
    // Regra de design: o Soulmon não pune por um dado que o jogador não jogou.
    for (const p of PET_PASSIVES) {
      expect(rubDailyCap(p.id, 1)).toBeGreaterThanOrEqual(1);
      expect(heartLossCap(p.id, 1)).toBeLessThanOrEqual(1);
      expect(heartDropBonus(p.id)).toBeGreaterThanOrEqual(0);
      expect(earliestPoopHour(p.id, 7)).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('passives — efeitos ligados às regras', () => {
  it('Guloso rende um ponto de atributo a mais por refeição', () => {
    const semTraco = feedFood(careBase(), '🍎', [], Date.now());
    const guloso = feedFood({ ...careBase(), petPassive: 'guloso' }, '🍎', [], Date.now());
    const soma = (s: CareState) => s.virusPoints + s.dataPoints + s.vaccinePoints;
    expect(soma(guloso.state)).toBe(soma(semTraco.state) + 1);
  });

  it('Carinhoso cura meio coração a mais por dia', () => {
    const hoje = 'Wed Aug 05 2026';
    const noCap = { date: hoje, healed: RUB_HEAL_DAILY_CAP };
    // Sem traço: já bateu o teto do dia.
    expect(rubHeal(careBase(), noCap, hoje).refused).toBe('daily-cap');
    // Carinhoso: ainda tem meio coração de sobra.
    const r = rubHeal({ ...careBase(), petPassive: 'carinhoso' }, noCap, hoje);
    expect(r.refused).toBeUndefined();
    expect(r.state.healthPoints).toBe(1.5);
  });

  it('Teimoso perde só meio coração num dia zerado', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const comum: any = computeDailyReset({ ...resetBase(), tasks } as any, { now: WEDNESDAY });
    const teimoso: any = computeDailyReset({ ...resetBase(), tasks, petPassive: 'teimoso' } as any, { now: WEDNESDAY });
    expect(comum.lastDayReport.heartsLost).toBe(MAX_HEARTS_LOST_PER_DAY);
    expect(teimoso.lastDayReport.heartsLost).toBe(MAX_HEARTS_LOST_PER_DAY / 2);
    expect(teimoso.healthPoints).toBeGreaterThan(comum.healthPoints);
  });

  it('Sortudo tem bônus de drop e Madrugador atrasa o cocô', () => {
    expect(heartDropBonus('sortudo')).toBeGreaterThan(0);
    expect(earliestPoopHour('madrugador', 7)).toBe(10);
    // Um traço não vaza no efeito do outro.
    expect(heartDropBonus('madrugador')).toBe(0);
    expect(earliestPoopHour('sortudo', 7)).toBe(7);
  });
});
