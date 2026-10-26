import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import {
  ROGUE_FLOORS, ROGUE_MAX_SCORE, ROGUE_MAX_STEPS, applyBonus, bonusChoices, CHALLENGE_POOL, challengeFor, emptyRun, floorsCleared, hpOf, isFinished,
  isForcedCombat, pathsFor, resolveStep, rogueScore, runForDay, rogueFightSetup, sanitizeRogueRun, simulateRogueCombat,
} from './rogueDungeon';

const D = '2026-10-25';

describe('rogueDungeon', () => {
  it('paridade do teto de score com o servidor', async () => {
    // @ts-expect-error módulo JS do servidor
    const srv = await import('../../functions/api/_rankings.js');
    expect(srv.MAX_SCORE_BY_GAME['rogue-dungeon']).toBe(ROGUE_MAX_SCORE);
    expect(srv.isRankedGame('rogue-dungeon')).toBe(true);
    expect(srv.scoreIsPlausible('rogue-dungeon', ROGUE_MAX_SCORE + 1)).toBe(false);
  });
  it('combate obrigatório no 3º, 6º e 8º desafio de cada andar', () => {
    const forced = Array.from({ length: 8 }, (_, i) => isForcedCombat(i));
    expect(forced).toEqual([false, false, true, false, false, true, false, true]);
    expect(pathsFor(D, 2)).toEqual(['combat']);
  });
  it('3 caminhos distintos e determinísticos nos passos livres', () => {
    const a = pathsFor(D, 0);
    expect(a).toHaveLength(3);
    expect(new Set(a).size).toBe(3);
    expect(pathsFor(D, 0)).toEqual(a);
  });
  it('vitória abre bônus; escolher fecha; bônus valem na incursão', () => {
    let r = resolveStep(emptyRun(D), 'puzzle', true);
    expect(r.bonusPending).toBe(true);
    expect(resolveStep(r, 'puzzle', true)).toBe(r);
    expect(new Set(bonusChoices(D, 0)).size).toBe(3);
    r = applyBonus(r, 'power');
    expect(r.power).toBe(1);
    expect(r.bonusPending).toBe(false);
  });
  it('perder combate encerra o dia; errar puzzle só gasta o passo', () => {
    expect(resolveStep(emptyRun(D), 'combat', false).over).toBe(true);
    const r = resolveStep(emptyRun(D), 'puzzle', false);
    expect(r).toMatchObject({ step: 1, won: 0, over: false });
  });
  it('24 passos fecham a incursão; score tem teto e bônus de andar', () => {
    let r = emptyRun(D);
    for (let i = 0; i < ROGUE_MAX_STEPS; i++) { r = resolveStep(r, 'puzzle', true); r = applyBonus(r, 'vigor'); }
    expect(isFinished(r)).toBe(true);
    expect(floorsCleared(r)).toBe(ROGUE_FLOORS);
    expect(rogueScore(r)).toBe(ROGUE_MAX_SCORE);
  });
  it('reset diário: outro dia descarta bônus', () => {
    const old = { ...emptyRun('2026-10-24'), power: 3, won: 5, step: 6 };
    expect(runForDay(old, D)).toEqual(emptyRun(D));
    expect(runForDay(old, '2026-10-24')).toBe(old);
  });
  it('leitura tolerante', () => {
    expect(sanitizeRogueRun(null)).toBeUndefined();
    expect(sanitizeRogueRun({ day: 'x' })).toBeUndefined();
    const r = sanitizeRogueRun({ day: D, step: 999, won: 'a', power: -4, over: 1 })!;
    expect(r.step).toBe(ROGUE_MAX_STEPS);
    expect(r.won).toBe(0);
    expect(r.power).toBe(0);
    expect(r.over).toBe(false);
  });
  it('desafios são jogos reais do pool do caminho, com meta positiva e determinísticos', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 24; s++) {
      for (const k of ['puzzle', 'minigame', 'explore'] as const) {
        const c = challengeFor(D, s, k);
        expect(CHALLENGE_POOL[k]).toContain(c.game);
        expect(c.goal).toBeGreaterThan(0);
        expect(challengeFor(D, s, k)).toEqual(c);
        seen.add(c.game);
      }
    }
    expect(seen.size).toBe(7);
  });
  it('combate usa o núcleo: determinístico; forte vence o 1º, fraco perde o chefe do 3º andar', () => {
    const strong = combatantAt(20, REFERENCE_BUILDS.balanced);
    const run = { day: D, power: 0, vigor: 0, shield: 0 };
    expect(simulateRogueCombat(run, 2, strong)).toEqual(simulateRogueCombat(run, 2, strong));
    expect(simulateRogueCombat(run, 2, strong).won).toBe(true);
    const weak = { ...combatantAt(1, REFERENCE_BUILDS.balanced), atk: 1, hp: 1 };
    expect(simulateRogueCombat(run, 23, weak).won).toBe(false);
  });
});

describe('rogueFightSetup (N7: a luta visível)', () => {
  it('é determinística e soma os bônus da incursão ao jogador', async () => {
    const { rogueFightSetup, emptyRun } = await import('./rogueDungeon');
    const { combatantAt, REFERENCE_BUILDS } = await import('./combate/level');
    const c = combatantAt(20, REFERENCE_BUILDS.balanced);
    const run = { ...emptyRun('2026-10-26'), power: 2, vigor: 1, shield: 1 };
    const a = rogueFightSetup(run, 2, c);
    const b = rogueFightSetup(run, 2, c);
    expect(a).toEqual(b);
    expect(a.combatant.atk).toBeCloseTo(c.atk * 1.12);
    expect(a.combatant.hp).toBeCloseTo(c.hp * 1.1);
    expect(a.startShield).toBeGreaterThan(0);
    expect(rogueFightSetup({ ...run, shield: 0 }, 2, c).startShield).toBe(0);
    expect(rogueFightSetup(run, 3, c).seed).not.toBe(a.seed);
  });
  it('vida contínua: a vitória guarda o HP restante, entre lutas e andares, sem encher', () => {
    let r = { ...emptyRun(D), step: 2 };
    r = resolveStep(r, 'combat', true, 0.4);
    expect(r.hp).toBe(0.4);
    r = applyBonus(r, 'heal');
    r = resolveStep({ ...r, step: 7 }, 'combat', true, 0.25); // cruza para o andar 2
    expect(r.hp).toBe(0.25);
    expect(floorsCleared(r)).toBe(1);
    expect(resolveStep({ ...r, bonusPending: false }, 'puzzle', true).hp).toBe(0.25); // não-combate não mexe
    expect(hpOf(r)).toBe(0.25);
  });
  it('vida: HP inicial entra na luta e a luta seguinte parte dele', () => {
    const c = combatantAt(20, REFERENCE_BUILDS.balanced);
    const full = simulateRogueCombat({ ...emptyRun(D) }, 0, c);
    const hurt = simulateRogueCombat({ ...emptyRun(D), hp: 0.3 }, 0, c);
    expect(hurt.hpLeft).toBeLessThanOrEqual(0.3 + 1e-9);
    expect(full.hpLeft).toBeGreaterThanOrEqual(hurt.hpLeft);
    expect(rogueFightSetup({ ...emptyRun(D), hp: 0.3 }, 0, c).startHp).toBe(0.3);
    expect(rogueFightSetup(emptyRun(D), 0, c).startHp).toBe(1);
  });
  it('vida: save sem hp lê vida cheia; save com hp é tolerante; reset diário enche', () => {
    expect(hpOf(sanitizeRogueRun({ day: D, step: 3 })!)).toBe(1);
    expect(sanitizeRogueRun({ day: D, step: 3 })).not.toHaveProperty('hp');
    expect(sanitizeRogueRun({ day: D, hp: 0.5 })!.hp).toBe(0.5);
    expect(sanitizeRogueRun({ day: D, hp: 'x' })!.hp).toBeUndefined();
    expect(sanitizeRogueRun({ day: D, hp: 7 })!.hp).toBeUndefined();
    expect(sanitizeRogueRun({ day: D, hp: -3 })!.hp).toBe(0.01);
    expect(hpOf(runForDay({ ...emptyRun('2026-10-24'), hp: 0.2 }, D))).toBe(1);
  });
});
