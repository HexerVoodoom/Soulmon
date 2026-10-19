import { describe, it, expect } from 'vitest';
import {
  POOP_MIN_GAP_H, POOP_SLEEP_MARGIN_H, awakeSecondGapHours, awakeSpanHours, inRestArc, normalizeMealTimes, parseHHMM,
  planDailyPoops, restArc,
} from './mealRhythm';

/** PRNG determinístico (mulberry32) — o sorteio varrido por muitas sementes. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WINDOWS = [
  { start: '23:00', end: '07:00' }, // padrão
  { start: '22:00', end: '06:00' },
  { start: '00:30', end: '08:30' }, // dentro do mesmo dia (acorda tarde)
  { start: '21:30', end: '05:30' },
  { start: '19:00', end: '05:00' }, // dia acordado curto
];

describe('D-05 — cocô 2×/dia garantido, sempre acordado, o 2º antes do sono', () => {
  it('awakeSpanHours: do despertar ao início do sono', () => {
    expect(awakeSpanHours({ start: '23:00', end: '07:00' })).toEqual([7, 23]);
    expect(awakeSpanHours({ start: '00:30', end: '08:30' })).toEqual([8.5, 24]);
    expect(awakeSpanHours(null)).toEqual([0, 22]);
  });

  for (const w of WINDOWS) for (const ritmo of [true, false]) for (const earliest of [7, 10]) {
    it(`janela ${w.start}–${w.end}, ritmo ${ritmo ? 'on' : 'off'}, earliest ${earliest}h: 2 cocôs acordado em 300 sorteios`, () => {
      const arc = restArc(w)!;
      const [wake, sleep] = awakeSpanHours(w);
      const times = normalizeMealTimes(undefined);
      for (let seed = 1; seed <= 300; seed++) {
        const [t1, t2] = planDailyPoops(prng(seed), { earliest, latest: 15, times, restWindow: w, aligned: ritmo });
        // dois cocôs, em ordem, dentro do trecho acordado e fora do arco de descanso
        expect(t1, `seed ${seed}`).toBeGreaterThanOrEqual(Math.max(wake, earliest) - 1e-9);
        expect(t2).toBeGreaterThan(t1);
        expect(t2, `seed ${seed}: 2º antes do sono`).toBeLessThanOrEqual(sleep - POOP_SLEEP_MARGIN_H + 1e-9);
        expect(inRestArc(Math.floor(t1 * 60), arc)).toBe(false);
        expect(inRestArc(Math.floor(t2 * 60), arc)).toBe(false);
        // a regra do 1º (até 15h) segue valendo quando o dia acordado comporta
        expect(t1).toBeLessThanOrEqual(15 + 1e-9);
      }
    });
  }

  it('dia acordado normal (07–23h): o intervalo é o de sempre (4 a 10 h) e quase sempre 8–10 h', () => {
    let noPref = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const [t1, t2] = planDailyPoops(prng(seed), {
        earliest: 7, latest: 15, times: normalizeMealTimes(undefined), restWindow: { start: '23:00', end: '07:00' }, aligned: false,
      });
      const gap = t2 - t1;
      expect(gap).toBeGreaterThanOrEqual(POOP_MIN_GAP_H - 1e-9);
      expect(gap).toBeLessThanOrEqual(10 + 1e-9);
      // 8 h cabem sempre que o 1º vem antes das 14h15 (14,25 + 8 = 22,25 = início do sono − margem)
      if (gap < 8 - 1e-9) { noPref++; expect(t1).toBeGreaterThan(14.25 - 1e-9); }
    }
    expect(noPref).toBeLessThan(120); // só o 1º tardio (14h15–15h) aperta o intervalo
  });

  it('com o ritmo ligado o 2º prefere o pós-jantar quando cabe (20h + 15 min … + 1h45)', () => {
    const times = normalizeMealTimes(undefined);
    const jantar = parseHHMM(times.dinner) / 60;
    let possiveis = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const [t1, t2] = planDailyPoops(prng(seed), { earliest: 7, latest: 15, times, restWindow: { start: '23:59', end: '07:00' }, aligned: true });
      // só quando 8–10 h depois do 1º cruza a janela do jantar o pós-jantar é possível — e então é OBRIGATÓRIO
      if (t1 + 8 <= jantar + 1.75 && t1 + 10 >= jantar + 0.25) {
        possiveis++;
        expect(t2, `seed ${seed}`).toBeGreaterThanOrEqual(jantar + 0.25 - 1e-9);
        expect(t2).toBeLessThanOrEqual(jantar + 1.75 + 1e-9);
      }
    }
    expect(possiveis).toBeGreaterThan(50);
  });

  it('save antigo (só o 1º agendado): o 2º é CLAMPADO ao dia acordado, nunca no sono', () => {
    const w = { start: '23:00', end: '07:00' };
    const midnight = new Date(2026, 9, 12, 0, 0, 0, 0).getTime();
    for (const firstH of [9, 12, 15, 18, 20, 21.5]) {
      for (let seed = 1; seed <= 100; seed++) {
        const gap = awakeSecondGapHours(prng(seed), midnight + firstH * 3600000, normalizeMealTimes(undefined), w, true);
        expect(gap, `1º às ${firstH}h`).toBeGreaterThan(0);
        // nunca depois de 22h15 (início do sono − margem), exceto o piso de 15 min quando o 1º já foi tarde demais
        if (firstH + 0.25 < 23 - POOP_SLEEP_MARGIN_H) expect(firstH + gap).toBeLessThanOrEqual(23 - POOP_SLEEP_MARGIN_H + 1e-9);
      }
    }
  });
});
