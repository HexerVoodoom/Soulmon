import { describe, it, expect } from 'vitest';
import {
  DISHES, DISHES_PER_DAY, MEAL_BUFF_VALUE_CAP, applyCook, chefsOn, cookRefusal, menuOn, isCombatEffect, mealAttrBonus, sanitizeRestaurant,
  type CookState,
} from './restaurant';
import { HUNGER_MAX, hungerAt, regenPoints, settleEnergy, UNIT_POINTS, energyStatus } from './hunger';
import { combinedAttrBonus, COMBAT_BONUS_CAP } from './combate/bonus';

// 2026-11-02 é segunda; sem âncora o dia do jogador é o do aparelho, então usamos meio-dia local.
const at = (iso: string) => new Date(`${iso}T12:00:00`).getTime();
const MON = at('2026-11-02'), TUE = at('2026-11-03'), SUN = at('2026-11-08');

const full = (): CookState => ({
  energyPoints: 0, evolutionStage: 'rookie',
  foodInventory: { '🥗': 9, '🧃': 9, '☕': 9, '🍚': 9, '🍎': 9, '🥩': 9, '🍭': 9, '🍕': 9 },
  gamePoints: 500,
  essences: { planta: 9, agua: 9, vida: 9, eletricidade: 9, arcano: 9, luz: 9 },
  buildingQuests: { day: 'x', visited: [], claimed: [], materials: { fang: 3, moss: 3, laurel: 3, spark: 3, ore: 3, down: 3 } },
  hunger: { v: 10, at: MON - 1000 },
});

describe('Restaurante — cardápio', () => {
  it('seg/qua/sex Snapjaw, ter/qui/sáb Caldo, domingo os dois com o cardápio inteiro', () => {
    expect([1, 3, 5].map(chefsOn)).toEqual([['snapjaw'], ['snapjaw'], ['snapjaw']]);
    expect([2, 4, 6].map(chefsOn)).toEqual([['caldo'], ['caldo'], ['caldo']]);
    expect(menuOn(0)).toHaveLength(DISHES.length);
    expect(menuOn(1).every(d => d.chef === 'snapjaw')).toBe(true);
  });
  it('todo prato usa 2+ comidas e um extra; combate só com material (nada que se compre com Crédito)', () => {
    for (const d of DISHES) {
      expect(Object.values(d.foods).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(2);
      expect(d.extra.qty).toBeGreaterThanOrEqual(1);
      if (isCombatEffect(d.effect)) expect(d.extra.type).toBe('material');
    }
  });
  it('o teto do sanitizador é o maior valor do cardápio por tipo', () => {
    for (const k of ['atk', 'def', 'spd', 'regen'] as const) {
      expect(MEAL_BUFF_VALUE_CAP[k]).toBe(Math.max(...DISHES.filter(d => d.effect.kind === k).map(d => d.effect.value)));
    }
  });
});

describe('Restaurante — cozinhar', () => {
  it('debita comidas, extra e Bits, enche a fome e dá energia na hora', () => {
    const s = applyCook(full(), 'cha-de-orvalho', MON).state;
    expect(s.foodInventory['☕']).toBe(8);
    expect(s.essences!.agua).toBe(7);
    expect(s.gamePoints).toBe(485);
    expect(hungerAt(s.hunger, MON)).toBe(HUNGER_MAX);
    expect(s.energyPoints).toBe(2);
  });
  it('prato de outro dia é recusado e o estado volta igual', () => {
    const s0 = full();
    const r = applyCook(s0, 'caldo-de-brasa', MON);
    expect(r.refused).toBe('not-today');
    expect(r.state).toBe(s0);
    expect(cookRefusal(s0, 'caldo-de-brasa', TUE)).toBeUndefined();
    expect(cookRefusal(s0, 'caldo-de-brasa', SUN)).toBeUndefined();
  });
  it(`no máximo ${DISHES_PER_DAY} pratos por dia`, () => {
    let s = full();
    for (let i = 0; i < DISHES_PER_DAY; i++) s = applyCook(s, 'salada-viva', MON + i).state;
    expect(applyCook(s, 'salada-viva', MON + 9).refused).toBe('daily-cap');
  });
  it('combate não aceita Bit vindo de Crédito', () => {
    const s = { ...full(), gamePoints: 40, bitsOrigin: { day: 'x', fromCredits: 30, paidLeft: 30 } } as CookState;
    expect(cookRefusal(s, 'espetinho-de-vinha', MON)).toBe('not-earned');
    expect(cookRefusal(s, 'salada-viva', MON)).toBeUndefined();
  });
  it('buff de ATK entra pelo canal único e respeita o teto de 5%', () => {
    const s = applyCook(full(), 'espetinho-de-vinha', MON).state;
    expect(s.buildingQuests!.materials.fang).toBe(2);
    expect(mealAttrBonus(s, MON + 1)).toEqual({ atk: 0.02 });
    expect(mealAttrBonus(s, MON + 25 * 3_600_000)).toBeUndefined();
    const total = combinedAttrBonus({ talent: { atk: 0.05 }, meal: mealAttrBonus(s, MON + 1) });
    expect(total.atk + total.def + total.spd).toBeCloseTo(COMBAT_BONUS_CAP);
  });
  it('buff de regeneração acelera a energia só dentro da janela', () => {
    const s = applyCook({ ...full(), energyPoints: 0 }, 'tigela-do-bosque', MON).state;
    const hour = 3_600_000;
    expect(regenPoints(s.hunger, MON, MON + hour, { from: MON, until: MON + 24 * hour, pct: 40 })).toBe(UNIT_POINTS * 14 / 10);
    const after = settleEnergy(s, MON + hour);
    expect(after.energyPoints).toBe(1);
    expect(energyStatus(after, MON + hour).msToNext).toBeLessThan(hour);
  });
  it('sanitizador: lixo vira undefined e valor editado é cortado', () => {
    expect(sanitizeRestaurant('x')).toBeUndefined();
    const r = sanitizeRestaurant({ buff: { dish: 'a', kind: 'atk', value: 50, from: 0, until: 10 ** 12 }, day: '2026-11-02', count: 1 })!;
    expect(r.buff!.value).toBe(2);
    expect(r.buff!.until).toBe(24 * 3_600_000);
    expect(sanitizeRestaurant(r)).toEqual(r);
  });
});
