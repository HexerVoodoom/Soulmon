/**
 * 6.1 (beta-2) — contador diário de camadas (SEM teto desde beta3 F2) + custo de energia na lógica AUTORITATIVA (`spendLayer`, a porta única que a tela e a conta de
 * quem ficou fora usam) e o contrato do campo `dungeonDaily` no save. REGISTRO §40.
 *
 * Aceite: bloqueia novas explorações no limite; integrado ao estado REAL de energia (com a regeneração acertada); progresso fora do ciclo
 * de vida da tela (reabrir/entrar/sair não devolve camada); sem recompensa duplicada; relógio que volta não reabre o dia.
 */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import {
  DUNGEON_ENERGY_PER_LAYER, DUNGEON_FIGHTS_PER_FLOOR, dungeonDayOf, layerRefusal, layersLeftToday, layersToday,
  sanitizeDungeonDaily, spendLayer, type LayerState,
} from './dungeonIdle';
import { applyDungeonAway } from './dungeonAway';
import { ENERGY_REGEN_MINUTES, settleEnergy } from './hunger';
import { soulCombatant } from './soulXP';
import type { DungeonAway } from './dungeonIdle';

const HORA = 3_600_000;
const T0 = Date.UTC(2026, 9, 13, 15, 0, 0); // 12:00 em Brasília
const DIA = 24 * HORA;
const estado = (over: Partial<LayerState> = {}): LayerState => ({ energyPoints: 12, evolutionStage: 'mega', energyClock: { at: T0, carry: 0 }, ...over });

describe('spendLayer — a porta única da camada (sem limite diário)', () => {
  it('gasta a energia da camada e conta UMA camada do dia', () => {
    const s = spendLayer(estado(), T0);
    expect(s.energyPoints).toBe(12 - DUNGEON_ENERGY_PER_LAYER);
    expect(layersToday(s, T0)).toBe(1);
    expect(layersLeftToday(s, T0)).toBe(Number.POSITIVE_INFINITY);
  });
  it('não há teto diário: só a energia recusa', () => {
    let s = estado({ energyPoints: 12 });
    for (let i = 0; i < 12; i++) s = spendLayer(s, T0 + i);
    expect(layersToday(s, T0 + 100)).toBe(12);
    expect(layerRefusal(s, T0 + 100)).toBe('no-energy');
    expect(spendLayer(s, T0 + 100)).toBe(s);
  });
  it('dia novo do jogador zera o contador', () => {
    let s = estado();
    for (let i = 0; i < 3; i++) s = spendLayer(s, T0);
    expect(layersToday(s, T0 + 2 * HORA)).toBe(3);
    expect(layersToday(s, T0 + DIA)).toBe(0);
  });
  it('REABRIR o app (JSON + sanitize) preserva o contador', () => {
    let s = estado();
    for (let i = 0; i < 4; i++) s = spendLayer(s, T0);
    const salvo = JSON.parse(JSON.stringify(s)) as LayerState;
    const reaberto = { ...salvo, dungeonDaily: sanitizeDungeonDaily(salvo.dungeonDaily) };
    expect(layersToday(reaberto, T0 + HORA)).toBe(4);
  });
});

describe('o campo `dungeonDaily` no save', () => {
  it('lixo vira undefined; valores absurdos são presos', () => {
    for (const lixo of [null, undefined, 1, 'x', [], {}, { day: 5, layers: 1 }, { day: '2026-10-13' }, { day: '13/10/2026', layers: 1 }, { day: '2026-10-13', layers: NaN }, { day: '2026-10-13', layers: 'a' }]) {
      expect(sanitizeDungeonDaily(lixo)).toBeUndefined();
    }
    expect(sanitizeDungeonDaily({ day: '2026-10-13', layers: 1e9 })).toEqual({ day: '2026-10-13', layers: 999 });
    expect(sanitizeDungeonDaily({ day: '2026-10-13', layers: -4.7 })).toEqual({ day: '2026-10-13', layers: 0 });
  });
});

describe('a conta de quem ficou fora', () => {
  const away = (over: Partial<DungeonAway> = {}): DungeonAway => {
    const c = soulCombatant({ evolutionStage: 'ultimate' });
    return {
      since: T0, seed: 424242, layer: 1, slot: DUNGEON_FIGHTS_PER_FLOOR, hp: 1, en: 0, ms: false,
      player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rb: 0, stage: 'ultimate' },
      ...over,
    };
  };
  const gs = (over: Record<string, unknown> = {}) => ({
    foodInventory: {}, gamePoints: 0, energyPoints: 12, totalXP: 5_000_000, evolutionStage: 'ultimate', dungeonAway: away(),
    energyClock: { at: T0, carry: 0 }, ...over,
  }) as unknown as GameState;

  it('a conta fora conta as camadas no contador e a energia sai pelo relógio', () => {
    const { next, report } = applyDungeonAway(gs({ energyPoints: 12 }), T0 + 8 * HORA);
    expect(report!.energy).toBeGreaterThan(0);
    expect(layersToday(next, T0 + 8 * HORA)).toBe(report!.energy);
  });
  it('com muitas camadas já feitas hoje a descida NÃO acaba por limite diário', () => {
    const hoje = dungeonDayOf({}, T0);
    const { report } = applyDungeonAway(gs({ dungeonDaily: { day: hoje, layers: 50 } }), T0 + 8 * HORA);
    expect(report!.ended).not.toBe('daily');
  });
  it('idempotente: reaplicar no mesmo instante não gasta de novo', () => {
    const a = applyDungeonAway(gs(), T0 + 3 * HORA);
    const b = applyDungeonAway(a.next, T0 + 3 * HORA);
    expect(layersToday(b.next, T0 + 3 * HORA)).toBe(layersToday(a.next, T0 + 3 * HORA));
    expect(b.next.energyPoints).toBe(a.next.energyPoints);
  });
});

describe('integração com a regeneração', () => {
  it('settleEnergy antes de gastar não duplica', () => {
    const s = spendLayer(estado({ energyPoints: 3, hunger: { v: 100, at: T0 } }), T0 + 5 * HORA);
    expect(settleEnergy(s, T0 + 5 * HORA).energyPoints).toBe(s.energyPoints);
  });
});
