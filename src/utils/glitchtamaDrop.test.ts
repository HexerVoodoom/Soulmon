import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import type { GameState } from '../contexts/GameStateContext';
import { mulberry32 } from './combate/rng';
import { applyDungeonAway } from './dungeonAway';
import type { DungeonAway } from './dungeonIdle';
import { playerDayIso } from './playerDay';
import { soulCombatant } from './soulXP';
import { weekMondayOf } from './premiumFood';
import {
  GLITCHTAMA_DROP_CHANCE, GLITCHTAMA_DROPS_PER_WEEK, glitchtamaDraw, glitchtamaDropFor, glitchtamaDroppedThisWeek, sanitizeGlitchtamaDrop, aplicarDropDoMarco,
} from './glitchtamaDrop';

const NOW = new Date(Date.UTC(2026, 10, 5, 15, 0, 0)); // quinta
const semanaDe = (d: Date) => weekMondayOf(playerDayIso(d, undefined));
const inv = (n = 0): { foodInventory: Record<string, number>; glitchtamaDrop?: { week: string; dropped: number } } => ({ foodInventory: n ? { '🌀': n } : {} });

describe('glitchtamaDropFor — 1% por marco', () => {
  it('a chance é 1% e o teto é 1 por semana', () => {
    expect(GLITCHTAMA_DROP_CHANCE).toBe(0.01);
    expect(GLITCHTAMA_DROPS_PER_WEEK).toBe(1);
  });
  it('só cai no marco (múltiplo de 5), com o sorteio abaixo de 1%', () => {
    expect(glitchtamaDropFor({}, 5, NOW, () => 0.0099)).toBe(true);
    expect(glitchtamaDropFor({}, 10, NOW, () => 0.0099)).toBe(true);
    expect(glitchtamaDropFor({}, 5, NOW, () => 0.01)).toBe(false);
    expect(glitchtamaDropFor({}, 5, NOW, () => 0.5)).toBe(false);
    expect(glitchtamaDropFor({}, 4, NOW, () => 0)).toBe(false);
    expect(glitchtamaDropFor({}, 6, NOW, () => 0)).toBe(false);
  });
  it('na média cai perto de 1% (sorteio semeado, 20 mil marcos)', () => {
    const r = mulberry32(7);
    let n = 0;
    for (let i = 0; i < 20_000; i++) if (glitchtamaDropFor({}, 5, NOW, r)) n++;
    expect(n / 20_000).toBeGreaterThan(0.007);
    expect(n / 20_000).toBeLessThan(0.013);
  });
});

describe('teto semanal no save', () => {
  it('o primeiro drop da semana grava o registro; o segundo é barrado, mesmo com sorteio de 0', () => {
    const s0 = inv();
    expect(glitchtamaDropFor(s0, 5, NOW, () => 0)).toBe(true);
    const s1 = aplicarDropDoMarco(s0, NOW);
    expect(s1.foodInventory['🌀']).toBe(1);
    expect(s1.glitchtamaDrop).toEqual({ week: semanaDe(NOW), dropped: 1 });
    expect(glitchtamaDropFor(s1, 10, NOW, () => 0)).toBe(false);
    expect(aplicarDropDoMarco(s1, NOW)).toBe(s1); // o updater reconfere o teto: não soma de novo
  });
  it('a semana seguinte (segunda-feira) libera de novo; o resto da mesma semana não', () => {
    const s1 = aplicarDropDoMarco(inv(), NOW);
    const domingo = new Date(Date.UTC(2026, 10, 8, 15, 0, 0));
    const segunda = new Date(Date.UTC(2026, 10, 9, 15, 0, 0));
    expect(glitchtamaDropFor(s1, 5, domingo, () => 0)).toBe(false);
    expect(glitchtamaDropFor(s1, 5, segunda, () => 0)).toBe(true);
    expect(aplicarDropDoMarco(s1, segunda).foodInventory['🌀']).toBe(2);
  });
  it('o estoque já guardado é preservado', () => {
    expect(aplicarDropDoMarco(inv(3), NOW).foodInventory['🌀']).toBe(4);
  });
});

describe('save antigo', () => {
  it('sem o campo, com lixo ou incompleto: nenhum drop contado (nunca trava nem quebra)', () => {
    for (const v of [undefined, null, 5, 'x', {}, { week: 3 }, { dropped: 1 }]) {
      expect(sanitizeGlitchtamaDrop(v)).toBeUndefined();
      expect(glitchtamaDroppedThisWeek({ glitchtamaDrop: v as never }, NOW)).toBe(0);
      expect(glitchtamaDropFor({ glitchtamaDrop: v as never }, 5, NOW, () => 0)).toBe(true);
    }
  });
  it('campo válido passa; contagem torta é higienizada', () => {
    expect(sanitizeGlitchtamaDrop({ week: '2026-11-02', dropped: 1 })).toEqual({ week: '2026-11-02', dropped: 1 });
    expect(sanitizeGlitchtamaDrop({ week: '2026-11-02', dropped: -4 })).toEqual({ week: '2026-11-02', dropped: 0 });
    expect(sanitizeGlitchtamaDrop({ week: '2026-11-02', dropped: 'x' })).toEqual({ week: '2026-11-02', dropped: 0 });
  });
  it('registro de OUTRA semana não vale', () => {
    expect(glitchtamaDroppedThisWeek({ glitchtamaDrop: { week: '2026-10-26', dropped: 1 } }, NOW)).toBe(0);
  });
});

// ── descida fora do app: MESMA regra, sorteio semeado ─────────────────────────────────────────────────────────────────────
const T0 = NOW.getTime();
const HORA = 3_600_000;
const mix = (seed: number, layer: number) => glitchtamaDraw(seed, layer)(); // o MESMO sorteio da tela e da descida fora do app
/** Seeds cujo sorteio do marco 5 cai / não cai — procuradas, não chutadas. */
const seedQueCai = (() => { for (let s = 1; s < 200_000; s++) if (mix(s, 5) < GLITCHTAMA_DROP_CHANCE) return s; throw new Error('sem seed'); })();
const seedQueNaoCai = (() => { for (let s = 1; s < 200_000; s++) if (mix(s, 5) >= GLITCHTAMA_DROP_CHANCE) return s; throw new Error('sem seed'); })();

function away(seed: number): DungeonAway {
  const c = soulCombatant({ evolutionStage: 'ultimate' });
  return {
    since: T0, seed, layer: 4, slot: 0, hp: 1, en: 0, ms: false,
    player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rb: 0, stage: 'ultimate' },
  };
}
const estado = (seed: number, over: Record<string, unknown> = {}) =>
  ({ foodInventory: {}, gamePoints: 0, energyPoints: 5000, totalXP: 5_000_000, evolutionStage: 'ultimate', dungeonAway: away(seed), ...over }) as unknown as GameState;

describe('descida fora do app', () => {
  it('seed que cai: Glitchtama no marco 5, registro da semana gravado, e o relatório bate com o estoque', () => {
    const { next, report } = applyDungeonAway(estado(seedQueCai), T0 + 8 * HORA);
    expect(Math.max(report!.toLayer, report!.recordTo)).toBeGreaterThanOrEqual(5);
    expect(report!.glitchtama).toBe(1);
    expect(next.foodInventory['🌀']).toBe(1);
    expect(next.glitchtamaDrop).toEqual({ week: semanaDe(NOW), dropped: 1 });
    expect(next.dungeonRunsCompleted).toBe(1);
  });
  it('seed que não cai: nenhum Glitchtama, mas a recompensa da run (marco) continua', () => {
    const { next, report } = applyDungeonAway(estado(seedQueNaoCai), T0 + 8 * HORA);
    expect(report!.glitchtama).toBe(0);
    expect(next.foodInventory['🌀'] ?? 0).toBe(0);
    expect(next.dungeonRunsCompleted).toBe(1);
  });
  it('teto semanal: com o drop da semana já gasto, mesmo a seed que cai não rende', () => {
    const gasto = { glitchtamaDrop: { week: semanaDe(NOW), dropped: 1 } };
    const { next, report } = applyDungeonAway(estado(seedQueCai, gasto), T0 + 8 * HORA);
    expect(report!.glitchtama).toBe(0);
    expect(next.foodInventory['🌀'] ?? 0).toBe(0);
    expect(next.glitchtamaDrop).toEqual(gasto.glitchtamaDrop);
  });
  it('reabrir o app não re-sorteia nem ganha por reprocessamento', () => {
    const t = T0 + 8 * HORA;
    const a = applyDungeonAway(estado(seedQueCai), t).next;
    const b = applyDungeonAway(a, t).next;
    expect(b.foodInventory['🌀']).toBe(a.foodInventory['🌀']);
    expect(b.glitchtamaDrop).toEqual(a.glitchtamaDrop);
    // o MESMO estado inicial jogado de novo dá o MESMO resultado (sorteio semeado, não Math.random)
    expect(applyDungeonAway(estado(seedQueCai), t).next.foodInventory['🌀']).toBe(a.foodInventory['🌀']);
  });
  it('save antigo (sem glitchtamaDrop) joga normalmente', () => {
    const s = estado(seedQueCai);
    expect('glitchtamaDrop' in s).toBe(false);
    expect(() => applyDungeonAway(s, T0 + 8 * HORA)).not.toThrow();
  });
});

describe('paridade tela × ausente', () => {
  it('as duas (e o App) chamam as MESMAS funções do dono único', () => {
    const tela = fs.readFileSync(`${process.cwd()}/src/components/DungeonGame.tsx`, 'utf8');
    const ausente = fs.readFileSync(`${process.cwd()}/src/utils/dungeonAway.ts`, 'utf8');
    for (const src of [tela, ausente]) expect(src).toMatch(/glitchtamaDropFor\(/);
    expect(ausente).toMatch(/aplicarDropDoMarco\(/);
    expect(fs.readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8')).toMatch(/aplicarDropDoMarco\(/);
  });
  it('com a mesma entrada (estado, camada, relógio, sorteio) o veredito é o mesmo que a descida fora do app usa', () => {
    // a tela passa `Math.random`; a descida passa o sorteio semeado: ambos entram no mesmo `glitchtamaDropFor`
    expect(glitchtamaDropFor({}, 5, NOW, () => mix(seedQueCai, 5))).toBe(true);
    expect(glitchtamaDropFor({}, 5, NOW, () => mix(seedQueNaoCai, 5))).toBe(false);
  });
});
