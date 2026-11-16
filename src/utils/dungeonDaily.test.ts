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
  DUNGEON_DAILY_FIGHTS, DUNGEON_DAILY_LAYERS, DUNGEON_ENERGY_PER_LAYER, DUNGEON_FIGHTS_PER_FLOOR, dungeonDayOf, layerRefusal, layersLeftToday, layersToday,
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

describe('spendLayer — a porta única da camada, com o LIMITE DIÁRIO (30 lutas = 5 andares)', () => {
  it('a constante: 30 lutas por dia = 5 andares de 6 lutas', () => {
    expect(DUNGEON_DAILY_FIGHTS).toBe(30);
    expect(DUNGEON_DAILY_LAYERS).toBe(5);
    expect(DUNGEON_DAILY_LAYERS * DUNGEON_FIGHTS_PER_FLOOR).toBe(DUNGEON_DAILY_FIGHTS);
  });
  it('gasta a energia da camada e conta UMA camada do dia', () => {
    const s = spendLayer(estado(), T0);
    expect(s.energyPoints).toBe(12 - DUNGEON_ENERGY_PER_LAYER);
    expect(layersToday(s, T0)).toBe(1);
    expect(layersLeftToday(s, T0)).toBe(DUNGEON_DAILY_LAYERS - 1);
  });
  it('a 6ª camada do dia é recusada pelo limite (com energia sobrando) e a recusa devolve a MESMA referência', () => {
    let s = estado({ energyPoints: 12 });
    for (let i = 0; i < DUNGEON_DAILY_LAYERS; i++) s = spendLayer(s, T0 + i);
    expect(layersToday(s, T0 + 100)).toBe(DUNGEON_DAILY_LAYERS);
    expect(layersLeftToday(s, T0 + 100)).toBe(0);
    expect(layerRefusal(s, T0 + 100)).toBe('daily-limit');
    expect(spendLayer(s, T0 + 100)).toBe(s);
    expect(s.energyPoints).toBe(12 - DUNGEON_DAILY_LAYERS); // a recusa não gasta energia
  });
  it('sem energia (e dentro do limite) a recusa é de energia', () => {
    expect(layerRefusal(estado({ energyPoints: 0 }), T0)).toBe('no-energy');
  });
  it('na virada do DIA DO JOGADOR o limite reabre (o relógio que volta não reabre)', () => {
    let s = estado({ energyPoints: 12 });
    for (let i = 0; i < DUNGEON_DAILY_LAYERS; i++) s = spendLayer(s, T0);
    expect(layerRefusal(s, T0 + 2 * HORA)).toBe('daily-limit');
    expect(layerRefusal(s, T0 - 2 * HORA)).toBe('daily-limit'); // relógio voltou: o dia do registro vale
    expect(layersLeftToday(s, T0 + DIA)).toBe(DUNGEON_DAILY_LAYERS);
    expect(layerRefusal({ ...s, energyPoints: 12, energyClock: { at: T0 + DIA, carry: 0 } }, T0 + DIA)).toBeUndefined();
  });
  it('SEM teto por level: o limite não depende de Lv nem de Vínculo (só energia e dia)', () => {
    const baixo = estado({ evolutionStage: 'baby1', energyPoints: 3 });
    expect(layerRefusal(baixo, T0)).toBeUndefined();
  });
  it('save ANTIGO: contador com camadas de uma era sem limite (ex.: 40 hoje) bloqueia só até a virada, sem quebrar', () => {
    const antigo = estado({ dungeonDaily: { day: dungeonDayOf({}, T0), layers: 40 } });
    expect(layerRefusal(antigo, T0)).toBe('daily-limit');
    expect(layersLeftToday(antigo, T0)).toBe(0);
    expect(layerRefusal(antigo, T0 + DIA)).toBeUndefined();
    expect(layerRefusal(estado({ dungeonDaily: sanitizeDungeonDaily({ day: 'lixo', layers: 3 }) }), T0)).toBeUndefined(); // lixo = nenhuma camada hoje
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
      player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rc: 0, stage: 'ultimate' },
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
  it('a descida fora da tela PARA no limite diário (no máximo 5 andares, 30 lutas) e a volta funciona', () => {
    const { next, report } = applyDungeonAway(gs({ energyPoints: 12 }), T0 + 8 * HORA);
    expect(report!.ended).toBe('daily');
    expect(layersToday(next, T0 + 8 * HORA)).toBe(DUNGEON_DAILY_LAYERS);
    expect(report!.energy).toBeLessThanOrEqual(DUNGEON_DAILY_LAYERS);
    expect(report!.enemies).toBeLessThanOrEqual(DUNGEON_DAILY_FIGHTS);
    expect(next.dungeonAway).toBeUndefined(); // o Soulmon voltou para casa
  });
  it('limite já batido hoje: a camada que a volta pagaria não é paga (fim "daily", energia intacta)', () => {
    const hoje = dungeonDayOf({}, T0);
    const { next, report } = applyDungeonAway(gs({ dungeonDaily: { day: hoje, layers: DUNGEON_DAILY_LAYERS } }), T0 + 8 * HORA);
    expect(report!.ended).toBe('daily');
    expect(report!.energy).toBe(0);
    expect(next.energyPoints).toBe(12);
  });
  it('SEM teto por level: um Soulmon de Lv 1 desce além do antigo teto (zona+margem = 5) se houver energia e limite', () => {
    const forte = soulCombatant({ evolutionStage: 'ultimate' });
    const lv1 = gs({ dungeonAway: away({ layer: 10, slot: DUNGEON_FIGHTS_PER_FLOOR, player: { ...away().player, level: 1, atk: forte.atk, def: forte.def, hp: forte.hp } }) });
    const { report } = applyDungeonAway(lv1, T0 + 8 * HORA);
    expect(report!.toLayer).toBeGreaterThan(10);
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
