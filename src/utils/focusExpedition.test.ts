import { describe, expect, it } from 'vitest';
import {
  FOCUS_ENVIRONMENTS, FOCUS_EXTRA_BASE_CHANCE, FOCUS_EXTRA_CHANCE_PER_CYCLE,
  FOCUS_EXTRA_MAX_CHANCE, FOCUS_LOOT_DAILY_CAP, applyFocusLoot, focusExtraChance,
  rollFocusLoot, sanitizeFocusLoot, type FocusLootRoll, type FocusLootState,
} from './focusExpedition';

describe('recompensas da expedição Pomodoro', () => {
  it('oferece seis cenários, cada um com quatro materiais únicos', () => {
    expect(FOCUS_ENVIRONMENTS).toHaveLength(6);
    for (const scene of FOCUS_ENVIRONMENTS) expect(new Set(scene.materials).size).toBe(4);
  });

  it('garante um item por foco e aumenta a chance de extra após ciclos foco+pausa até o teto', () => {
    expect(focusExtraChance(0)).toBe(FOCUS_EXTRA_BASE_CHANCE);
    expect(focusExtraChance(1)).toBe(FOCUS_EXTRA_BASE_CHANCE + FOCUS_EXTRA_CHANCE_PER_CYCLE);
    expect(focusExtraChance(99)).toBe(FOCUS_EXTRA_MAX_CHANCE);
    const first = rollFocusLoot('forest', 0, () => 0.999);
    expect(first.primary).toBeTruthy();
    expect(first.extra).toBeUndefined();
    const lucky = rollFocusLoot('forest', 0, () => 0);
    expect(lucky.extra).toBeTruthy();
  });

  it('comida compete como a quinta opção de peso igual e escolhe aleatoriamente uma das comidas', () => {
    const food = rollFocusLoot('forest', 0, () => 0.999);
    expect(food.primary.kind).toBe('food');
    expect(FOCUS_ENVIRONMENTS.map(environment => environment.materials.length)).toEqual([4, 4, 4, 4, 4, 4]);
  });

  it('grava uma única recompensa por evento e aplica o teto diário combinado de materiais e comidas', () => {
    const state: FocusLootState = { foodInventory: {}, buildingQuests: { day: '2026-10-09', visited: [], claimed: [], materials: {} } };
    const drop: FocusLootRoll = { primary: { kind: 'material', id: 'moss', icon: '🌿', namePt: 'Musgo', nameEn: 'Moss' }, extra: { kind: 'food', id: '🍎', icon: '🍎', namePt: 'Apple', nameEn: 'Apple' }, chancePercent: 5 };
    let current: FocusLootState = state;
    for (let i = 0; i < FOCUS_LOOT_DAILY_CAP / 2; i++) {
      const granted = applyFocusLoot(current, { day: '2026-10-09', environment: 'forest', sessionId: 's1', eventId: `event-${i}` }, drop);
      expect(granted.accepted).toBe(true);
      current = granted.state;
    }
    expect(current.focusLoot?.items).toBe(8);
    expect(current.buildingQuests?.materials.moss).toBe(4);
    expect(current.foodInventory['🍎']).toBe(4);
    const atCap = applyFocusLoot(current, { day: '2026-10-09', environment: 'forest', sessionId: 's1', eventId: 'event-cap' }, drop);
    expect(atCap.accepted).toBe(false);
    expect(applyFocusLoot(current, { day: '2026-10-09', environment: 'forest', sessionId: 's1', eventId: 'event-0' }, drop).accepted).toBe(false);
  });

  it('sanea ledger inválido e não perde recompensa se um material já estiver no limite do estoque', () => {
    expect(sanitizeFocusLoot({ day: 'Wed Oct 07 2026', items: 2, claims: [] })).toBeUndefined();
    const full = { foodInventory: {}, buildingQuests: { day: '2026-10-09', visited: [], claimed: [], materials: { moss: 99 } } };
    const drop: FocusLootRoll = { primary: { kind: 'material', id: 'moss', icon: '🌿', namePt: 'Musgo', nameEn: 'Moss' }, chancePercent: 5 };
    const granted = applyFocusLoot(full, { day: '2026-10-09', environment: 'forest', sessionId: 's', eventId: 'at-cap' }, drop);
    expect(granted.items[0].kind).toBe('food');
    expect(granted.state.foodInventory[granted.items[0].id]).toBe(1);
  });
});
