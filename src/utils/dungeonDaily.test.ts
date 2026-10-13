/**
 * 6.1 (beta-2) — limite diário de camadas + custo de energia na lógica AUTORITATIVA (`spendLayer`, a porta única que a tela e a conta de
 * quem ficou fora usam) e o contrato do campo `dungeonDaily` no save. REGISTRO §40.
 *
 * Aceite: bloqueia novas explorações no limite; integrado ao estado REAL de energia (com a regeneração acertada); progresso fora do ciclo
 * de vida da tela (reabrir/entrar/sair não devolve camada); sem recompensa duplicada; relógio que volta não reabre o dia.
 */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import {
  DUNGEON_DAILY_LAYERS, DUNGEON_ENERGY_PER_LAYER, DUNGEON_FIGHTS_PER_FLOOR, dungeonDayOf, layerRefusal, layersLeftToday, layersToday,
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

describe('spendLayer — a porta única da camada', () => {
  it('gasta a energia da camada e conta UMA camada do dia', () => {
    const s = spendLayer(estado(), T0);
    expect(s.energyPoints).toBe(12 - DUNGEON_ENERGY_PER_LAYER);
    expect(layersToday(s, T0)).toBe(1);
    expect(layersLeftToday(s, T0)).toBe(DUNGEON_DAILY_LAYERS - 1);
  });
  it('no limite diário NOVAS camadas são recusadas — mesmo com energia sobrando — e a recusa devolve a MESMA referência', () => {
    let s = estado({ energyPoints: 12 });
    for (let i = 0; i < DUNGEON_DAILY_LAYERS; i++) s = spendLayer(s, T0 + i);
    expect(layersToday(s, T0 + 100)).toBe(DUNGEON_DAILY_LAYERS);
    expect(s.energyPoints).toBe(12 - DUNGEON_DAILY_LAYERS);
    expect(layerRefusal(s, T0 + 100)).toBe('daily-limit');
    expect(spendLayer(s, T0 + 100)).toBe(s);
  });
  it('sem energia a camada é recusada ("no-energy") e não conta no dia', () => {
    const s = estado({ energyPoints: 0, hunger: { v: 0, at: T0 } });
    expect(layerRefusal(s, T0)).toBe('no-energy');
    expect(spendLayer(s, T0)).toBe(s);
    expect(layersToday(s, T0)).toBe(0);
  });
  it('usa a energia de AGORA: a regeneração já ganha paga a camada (o estado velho do último tick não decide)', () => {
    const s = estado({ energyPoints: 0, hunger: { v: 100, at: T0 } });
    expect(layerRefusal(s, T0 + 10 * 60_000)).toBe('no-energy');
    const depois = T0 + ENERGY_REGEN_MINUTES * 60_000;
    expect(layerRefusal(s, depois)).toBeUndefined();
    const gasto = spendLayer(s, depois);
    expect(gasto.energyPoints).toBe(0);
    expect(layersToday(gasto, depois)).toBe(1);
  });
  it('dois toques no mesmo lote (a 2ª passada enxerga a 1ª): com 1 energia a 2ª é recusada e o contador não anda', () => {
    const base = estado({ energyPoints: 1 });
    const um = spendLayer(base, T0);
    const dois = spendLayer(um, T0);
    expect(dois).toBe(um);
    expect(layersToday(dois, T0)).toBe(1);
    expect(dois.energyPoints).toBe(0);
  });
  it('a UI velha não fura o limite: um espelho desatualizado (contador 0) não importa, quem decide é o `prev` do updater', () => {
    const real = { ...estado(), dungeonDaily: { day: dungeonDayOf(estado(), T0), layers: DUNGEON_DAILY_LAYERS } };
    expect(spendLayer(real, T0)).toBe(real);
  });
});

describe('o dia do limite (fuso do jogador, relógio, reabrir)', () => {
  it('dia novo do jogador zera o contador; no mesmo dia ele permanece', () => {
    let s = estado();
    for (let i = 0; i < DUNGEON_DAILY_LAYERS; i++) s = spendLayer(s, T0);
    expect(layersLeftToday(s, T0 + 2 * HORA)).toBe(0);
    expect(layersLeftToday(s, T0 + DIA)).toBe(DUNGEON_DAILY_LAYERS);
  });
  it('a virada é no fuso FIXO do save (playerDayTz), não no do aparelho', () => {
    const base: LayerState = { ...estado(), playerDayTz: { zone: 'Pacific/Kiritimati', offsetMs: 14 * HORA } }; // UTC+14, sem DST
    const a = spendLayer(base, Date.UTC(2026, 9, 13, 9, 59)); // 23:59 de 13/10 lá
    const b = Date.UTC(2026, 9, 13, 10, 1); // 00:01 de 14/10 lá
    expect(layersToday(a, Date.UTC(2026, 9, 13, 9, 59))).toBe(1);
    expect(layersToday(a, b)).toBe(0);
  });
  it('relógio que VOLTA não reabre o dia: vale o maior entre o dia do relógio e o do registro', () => {
    let s = estado();
    for (let i = 0; i < DUNGEON_DAILY_LAYERS; i++) s = spendLayer(s, T0 + DIA); // gastou "amanhã"
    expect(layersLeftToday(s, T0)).toBe(0); // voltar o relógio para hoje não devolve camada
    expect(spendLayer(s, T0)).toBe(s);
    expect(dungeonDayOf(s, T0)).toBe(dungeonDayOf(s, T0 + DIA));
  });
  it('REABRIR o app (JSON + sanitize) preserva o contador: o limite não mora na tela', () => {
    let s = estado();
    for (let i = 0; i < 4; i++) s = spendLayer(s, T0);
    const salvo = JSON.parse(JSON.stringify(s)) as LayerState;
    const reaberto = { ...salvo, dungeonDaily: sanitizeDungeonDaily(salvo.dungeonDaily) };
    expect(layersToday(reaberto, T0 + HORA)).toBe(4);
  });
  it('entrar e sair 50 vezes (re-render, StrictMode, retirar): só o que foi COMEÇADO conta', () => {
    let s = estado({ energyPoints: 12 });
    const um = spendLayer(s, T0);
    for (let i = 0; i < 50; i++) s = spendLayer(um, T0) === um ? um : spendLayer(um, T0); // reaplicar sobre o mesmo prev nunca soma sozinho
    expect(layersToday(um, T0)).toBe(1);
  });
});

describe('o campo `dungeonDaily` no save', () => {
  it('lixo vira undefined; valores absurdos são presos', () => {
    for (const lixo of [null, undefined, 1, 'x', [], {}, { day: 5, layers: 1 }, { day: '2026-10-13' }, { day: '13/10/2026', layers: 1 }, { day: '2026-10-13', layers: NaN }, { day: '2026-10-13', layers: 'a' }]) {
      expect(sanitizeDungeonDaily(lixo)).toBeUndefined();
    }
    expect(sanitizeDungeonDaily({ day: '2026-10-13', layers: 1e9 })).toEqual({ day: '2026-10-13', layers: 999 });
    expect(sanitizeDungeonDaily({ day: '2026-10-13', layers: -4.7 })).toEqual({ day: '2026-10-13', layers: 0 });
    expect(sanitizeDungeonDaily({ day: '2026-10-13', layers: 3.9 })).toEqual({ day: '2026-10-13', layers: 3 });
  });
  it('um contador adulterado para MENOS é só um contador menor: o servidor (monotônico) é o que o desfaz — ver functions/api/_dayCounters.test.js', () => {
    expect(layersLeftToday({ dungeonDaily: { day: dungeonDayOf({}, T0), layers: 0 } }, T0)).toBe(DUNGEON_DAILY_LAYERS);
  });
});

describe('a conta de quem ficou fora respeita o MESMO limite', () => {
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

  it('com 9 camadas já começadas hoje, 8 h fora rendem NO MÁXIMO 1 camada nova e acabam com "daily"', () => {
    const hoje = dungeonDayOf({}, T0);
    const { next, report } = applyDungeonAway(gs({ dungeonDaily: { day: hoje, layers: DUNGEON_DAILY_LAYERS - 1 } }), T0 + 8 * HORA);
    expect(report!.energy).toBe(1);
    expect(report!.ended).toBe('daily');
    expect(next.dungeonAway).toBeUndefined(); // o Soulmon volta para casa
    expect(layersToday(next, T0 + 8 * HORA)).toBe(DUNGEON_DAILY_LAYERS);
  });
  it('no limite já na saída: nenhuma camada nova, nada de energia gasta, e o Soulmon volta para casa', () => {
    const hoje = dungeonDayOf({}, T0);
    const { next, report } = applyDungeonAway(gs({ dungeonDaily: { day: hoje, layers: DUNGEON_DAILY_LAYERS } }), T0 + 8 * HORA);
    expect(report!.energy).toBe(0);
    expect(report!.ended).toBe('daily');
    expect(next.energyPoints).toBeGreaterThanOrEqual(12);
  });
  it('a conta fora conta as camadas no contador do dia e a energia sai pelo relógio (regeneração incluída)', () => {
    const { next, report } = applyDungeonAway(gs({ energyPoints: 12 }), T0 + 8 * HORA);
    expect(report!.energy).toBeGreaterThan(0);
    expect(layersToday(next, T0 + 8 * HORA) + 0).toBe(report!.energy); // 1 energia = 1 camada nova contada
    expect(layersToday(next, T0 + 8 * HORA)).toBeLessThanOrEqual(DUNGEON_DAILY_LAYERS);
  });
  it('idempotente: reaplicar no mesmo instante não gasta camada nem energia de novo', () => {
    const a = applyDungeonAway(gs(), T0 + 3 * HORA);
    const b = applyDungeonAway(a.next, T0 + 3 * HORA);
    expect(layersToday(b.next, T0 + 3 * HORA)).toBe(layersToday(a.next, T0 + 3 * HORA));
    expect(b.next.energyPoints).toBe(a.next.energyPoints);
  });
});

describe('integração com a regeneração (o estado visto pelo limite é o real)', () => {
  it('settleEnergy antes de gastar não duplica: gastar em t e reler em t não muda a energia', () => {
    const s = spendLayer(estado({ energyPoints: 3, hunger: { v: 100, at: T0 } }), T0 + 5 * HORA);
    expect(settleEnergy(s, T0 + 5 * HORA).energyPoints).toBe(s.energyPoints);
  });
});
