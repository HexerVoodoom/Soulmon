import { describe, it, expect } from 'vitest';
import {
  GAP_SONORO_MIN_MS, LAND_GAP_MS, PITCH_MAX_STEPS, POP_STAGGER_MS, ROLL_DELAY_MS, ROLL_MS, ROLL_TICK_MS,
  odometerDigits, pitchStep, reelLoops, rewardTimeline,
} from './rewardReveal';
import { JANELA_DE_COINCIDENCIA_MS } from './audioBus';

describe('rewardTimeline — o cronograma puro da revelação', () => {
  const tl = rewardTimeline([{ key: 'a', roll: true }, { key: 'b' }, { key: 'c' }]);

  it('cada passo estoura em ordem, espaçado de ~250 ms (o contador de Bits segura os seguintes até pousar)', () => {
    expect(tl.popAt.a).toBe(0);
    expect(tl.popAt.b).toBe(ROLL_DELAY_MS + ROLL_MS + POP_STAGGER_MS);
    expect(tl.popAt.c - tl.popAt.b).toBe(POP_STAGGER_MS);
  });

  it('o odômetro roda `ROLL_MS` depois do ícone e pousa com um único "ding"', () => {
    const roll = tl.events.find(e => e.type === 'roll')!;
    const land = tl.events.filter(e => e.type === 'land');
    expect(roll.at).toBe(ROLL_DELAY_MS);
    expect(land).toHaveLength(1);
    expect(land[0].at).toBe(ROLL_DELAY_MS + ROLL_MS);
  });

  it('os tiques acontecem só durante a rolagem e o último deixa folga antes do pouso', () => {
    const ticks = tl.events.filter(e => e.type === 'tick');
    expect(ticks.length).toBeGreaterThan(3);
    for (const t of ticks) expect(t.at).toBeGreaterThanOrEqual(ROLL_DELAY_MS);
    expect(Math.max(...ticks.map(t => t.at))).toBeLessThanOrEqual(ROLL_DELAY_MS + ROLL_MS - LAND_GAP_MS);
  });

  it('TODO par de eventos sonoros fica fora da janela de coincidência da R-EX (o segundo não seria descartado)', () => {
    expect(GAP_SONORO_MIN_MS).toBeGreaterThan(JANELA_DE_COINCIDENCIA_MS);
    const sonoros = tl.events.filter(e => !(e.type === 'pop' && e.silent) && e.type !== 'roll').map(e => e.at).sort((a, b) => a - b);
    for (let i = 1; i < sonoros.length; i++) {
      expect(sonoros[i] - sonoros[i - 1], `eventos em ${sonoros[i - 1]} e ${sonoros[i]} ms`).toBeGreaterThanOrEqual(ROLL_TICK_MS - 10);
      expect(sonoros[i] - sonoros[i - 1]).toBeGreaterThan(JANELA_DE_COINCIDENCIA_MS);
    }
  });

  it('o tom do "pop" sobe um semitom por ícone e para no teto; passos mudos não sobem', () => {
    const t2 = rewardTimeline(Array.from({ length: 14 }, (_, i) => ({ key: `k${i}` })));
    const pitches = t2.events.filter(e => e.type === 'pop').map(e => (e as { pitch: number }).pitch);
    expect(pitches.slice(0, 3)).toEqual([0, 1, 2]);
    expect(Math.max(...pitches)).toBe(PITCH_MAX_STEPS);
    expect(pitchStep(99)).toBe(PITCH_MAX_STEPS);
    const mudo = rewardTimeline([{ key: 'x', silent: true }, { key: 'y' }]);
    expect((mudo.events.find(e => e.type === 'pop' && e.key === 'y') as { pitch: number }).pitch).toBe(0);
  });

  it('`startMs` desloca tudo; lista vazia não quebra', () => {
    expect(rewardTimeline([{ key: 'a' }], 500).popAt.a).toBe(500);
    expect(rewardTimeline([]).events).toEqual([]);
  });
});

describe('odômetro', () => {
  it('os dígitos finais são o valor (um por coluna); lixo vira 0', () => {
    expect(odometerDigits(1234)).toEqual([1, 2, 3, 4]);
    expect(odometerDigits(0)).toEqual([0]);
    expect(odometerDigits(-5)).toEqual([0]);
    expect(odometerDigits(NaN)).toEqual([0]);
    expect(odometerDigits(7.9)).toEqual([7]);
  });
  it('a coluna das unidades gira mais voltas que a mais à esquerda', () => {
    expect(reelLoops(2, 3)).toBe(1);
    expect(reelLoops(0, 3)).toBe(3);
    expect(reelLoops(0, 1)).toBe(1);
  });
});
