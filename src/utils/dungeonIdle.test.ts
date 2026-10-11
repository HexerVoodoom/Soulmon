/**
 * A descida idle da Masmorra (08/10/2026): HP persistente com regeneração por TIMESTAMP, piso de entrada,
 * posição da luta e a simulação de que a descida infinita TERMINA em tempo razoável e que o que ela paga
 * continua limitado pelo teto diário de Bits (o funil `creditMinigameBits`).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  DUNGEON_AUTO_FIGHT_MS, DUNGEON_FIGHTS_PER_FLOOR, DUNGEON_HP_REGEN_FULL_HOURS, DUNGEON_MIN_HP_TO_ENTER_PCT, DUNGEON_MILESTONE_FLOOR,
  hpAgora, gravarHp, podeDescer, msAteDescer, posicaoDaLuta, formatarEspera, sanitizeDungeonHp,
} from './dungeonIdle';
import { simulateDungeonRunV3 } from './dungeonFight';
import { buildDungeonWave, LADDER_TIERS } from './dungeon';
import { creditMinigameBits, MINIGAME_BITS_PER_DAY } from './currencies';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { SPECIAL_FAMILIES } from './combate/specials';
import { clearBonus } from '../components/DungeonGame';

vi.setConfig({ testTimeout: 180_000 });

const H = 3_600_000;
const T0 = 1_700_000_000_000;

describe('constantes (o dono ajusta; este é o valor combinado)', () => {
  it('4 h de zero a cheio, piso de 25%, 3–5 s entre lutas, 6 lutas por andar, marco no andar 5', () => {
    expect(DUNGEON_HP_REGEN_FULL_HOURS).toBe(4);
    expect(DUNGEON_MIN_HP_TO_ENTER_PCT).toBe(25);
    expect(DUNGEON_AUTO_FIGHT_MS).toBeGreaterThanOrEqual(3000);
    expect(DUNGEON_AUTO_FIGHT_MS).toBeLessThanOrEqual(5000);
    expect(DUNGEON_FIGHTS_PER_FLOOR).toBe(6);
    expect(DUNGEON_FIGHTS_PER_FLOOR).toBe(LADDER_TIERS.length); // a escada inteira: baby-i → mega
    expect(DUNGEON_MILESTONE_FLOOR).toBe(5);
  });
});

describe('hpAgora — por timestamp, função pura', () => {
  it('sem registro o HP é cheio (save antigo não herda dívida)', () => {
    expect(hpAgora({}, T0)).toBe(1);
    expect(podeDescer({}, T0)).toBe(true);
  });
  it('regenera linearmente com o tempo, inclusive "offline" (mesmo resultado sem nenhum tick)', () => {
    const s = { dungeonHp: gravarHp(0, T0) };
    expect(hpAgora(s, T0)).toBe(0);
    expect(hpAgora(s, T0 + 1 * H)).toBeCloseTo(0.25, 10);
    expect(hpAgora(s, T0 + 2 * H)).toBeCloseTo(0.5, 10);
    expect(hpAgora(s, T0 + 9 * H)).toBe(1);
  });
  it('NUNCA passa do máximo e nunca fica negativo, mesmo com lixo ou relógio que voltou', () => {
    expect(hpAgora({ dungeonHp: { frac: 0.9, at: T0 } }, T0 + 100 * H)).toBe(1);
    expect(hpAgora({ dungeonHp: { frac: 0.4, at: T0 } }, T0 - 5 * H)).toBe(0.4); // relógio voltou: vale o gravado
    expect(hpAgora({ dungeonHp: { frac: 7, at: T0 } }, T0)).toBe(1);
    expect(hpAgora({ dungeonHp: { frac: -3, at: T0 } }, T0)).toBe(0);
    expect(hpAgora({ dungeonHp: { frac: Number.NaN, at: T0 } }, T0)).toBe(0);
  });
  it('é pura: não muda o que recebe', () => {
    const s = Object.freeze({ dungeonHp: Object.freeze({ frac: 0.1, at: T0 }) });
    expect(() => hpAgora(s, T0 + H)).not.toThrow();
    expect(s.dungeonHp.frac).toBe(0.1);
  });
});

describe('piso de entrada', () => {
  it('abaixo de 25% não desce; a espera é exata e some quando o piso é atingido', () => {
    const s = { dungeonHp: gravarHp(0, T0) };
    expect(podeDescer(s, T0)).toBe(false);
    expect(msAteDescer(s, T0)).toBe(1 * H); // 25% de 4 h
    expect(msAteDescer(s, T0 + 0.5 * H)).toBe(0.5 * H);
    expect(podeDescer(s, T0 + 1 * H)).toBe(true);
    expect(msAteDescer(s, T0 + 1 * H)).toBe(0);
  });
  it('com HP no piso ou acima a espera é zero', () => {
    expect(msAteDescer({ dungeonHp: gravarHp(0.25, T0) }, T0)).toBe(0);
    expect(msAteDescer({ dungeonHp: gravarHp(1, T0) }, T0)).toBe(0);
  });
});

describe('higienização e posição', () => {
  it('sanitizeDungeonHp descarta lixo e aperta o intervalo', () => {
    expect(sanitizeDungeonHp(null)).toBeUndefined();
    expect(sanitizeDungeonHp('x')).toBeUndefined();
    expect(sanitizeDungeonHp({ frac: '1', at: 1 })).toBeUndefined();
    expect(sanitizeDungeonHp({ frac: 2, at: -4 })).toEqual({ frac: 1, at: 0 });
    expect(sanitizeDungeonHp({ frac: 0.3, at: T0 })).toEqual({ frac: 0.3, at: T0 });
  });
  it('6 lutas = +1 andar, sem teto', () => {
    expect(posicaoDaLuta(0)).toEqual({ floor: 1, slot: 0 });
    expect(posicaoDaLuta(5)).toEqual({ floor: 1, slot: 5 });
    expect(posicaoDaLuta(6)).toEqual({ floor: 2, slot: 0 });
    expect(posicaoDaLuta(29)).toEqual({ floor: 5, slot: 5 });
    expect(posicaoDaLuta(6 * 40).floor).toBe(41);
  });
  it('a espera é legível nas duas línguas', () => {
    expect(formatarEspera(65 * 60_000, false)).toBe('1h 05m');
    expect(formatarEspera(65 * 60_000, true)).toBe('1 h 05 min');
    expect(formatarEspera(10_000, false)).toBe('1m');
  });
});

describe('simulação: a descida TERMINA em tempo razoável e o que paga fica sob o teto diário', () => {
  const N = 200;
  const cell = (s: number) => ({
    level: RULER_LEVELS[s % RULER_LEVELS.length],
    build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
    family: SPECIAL_FAMILIES[(s >> 4) % 7],
  });

  it('com 60 andares de folga NENHUMA descida chega ao fim da escada: a dificuldade derruba o jogador antes; duração e Bits medidos', () => {
    let maxFloors = 0, maxSeconds = 0, sumFloors = 0, maxPago = 0;
    for (let s = 0; s < N; s++) {
      const r = simulateDungeonRunV3(cell(s), s, 'media', 60);
      expect(r.won, `run ${s}`).toBe(false);
      const lutas = r.timesByFloor.flat();
      const floorsPlayed = r.timesByFloor.length;
      const seconds = lutas.reduce((a, t) => a + t, 0) + lutas.length * (DUNGEON_AUTO_FIGHT_MS / 1000);
      maxFloors = Math.max(maxFloors, floorsPlayed);
      sumFloors += floorsPlayed;
      maxSeconds = Math.max(maxSeconds, seconds);
      // o que a descida PAGARIA sem teto (Bits por inimigo + bônus de andar limpo)
      let pago = 0;
      for (let f = 1; f <= Math.max(1, r.floorsCleared); f++) pago += buildDungeonWave(f, 'rookie').reduce((a, e) => a + e.points, 0) + clearBonus(f);
      maxPago = Math.max(maxPago, pago);
    }
    console.log(`[idle] ${N} descidas: andares médios ${(sumFloors / N).toFixed(2)}, máx ${maxFloors}; duração máx ${(maxSeconds / 60).toFixed(1)} min; Bits sem teto máx ${maxPago}`);
    expect(maxFloors).toBeLessThan(15);
    expect(maxSeconds).toBeLessThan(40 * 60);
  });

  it('o teto diário de Bits continua valendo no funil: nenhuma sequência de descidas passa de MINIGAME_BITS_PER_DAY', () => {
    let st: Parameters<typeof creditMinigameBits>[0] = { gamePoints: 0 } as never;
    for (let i = 0; i < 200; i++) st = creditMinigameBits(st, 40, '2026-10-08') as never;
    expect((st as { gamePoints: number }).gamePoints).toBeLessThanOrEqual(MINIGAME_BITS_PER_DAY);
  });
});
