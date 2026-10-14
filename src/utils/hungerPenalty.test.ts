import { describe, it, expect } from 'vitest';
import { applyHungerPenalty, starvingWindows, sanitizeHungerPenalty, msToNextHungerLoss, HUNGER_PENALTY_WINDOW_MS as W } from './hungerPenalty';
import { eat, HUNGER_FAIR_MIN, starvingSince } from './hunger';

const H = 3_600_000;
const T0 = 1_700_000_000_000;
// fome 0 em T0: já faminto desde T0 (rec.v < 20 -> âncora = rec.at)
const faminto = (hp = 3, extra: object = {}) => ({ healthPoints: hp, energyPoints: 0, hunger: { v: 0, at: T0 }, ...extra }) as any;

describe('penalidade de fome (REGISTRO §45)', () => {
  it('não perde nada antes de 12 h contínuas de fome', () => {
    const s = faminto();
    expect(applyHungerPenalty(s, T0 + W - 1)).toBe(s);
  });

  it('perde MEIO coração em 12 h e mais meio em 24 h (no máximo 1 por janela)', () => {
    let s = applyHungerPenalty(faminto(), T0 + W);
    expect(s.healthPoints).toBe(2.5);
    expect(applyHungerPenalty(s, T0 + W + 5 * H)).toBe(s); // mesma janela: nada
    s = applyHungerPenalty(s, T0 + 2 * W);
    expect(s.healthPoints).toBe(2);
  });

  it('sem punição dupla ao reabrir: ler de novo (ou recarregar o save) no mesmo instante não cobra', () => {
    const s1 = applyHungerPenalty(faminto(), T0 + W + 1000);
    expect(applyHungerPenalty(s1, T0 + W + 1000)).toBe(s1);
    const recarregado = { ...s1, hungerPenalty: sanitizeHungerPenalty(JSON.parse(JSON.stringify(s1.hungerPenalty))) };
    expect(applyHungerPenalty(recarregado, T0 + W + 2000)).toBe(recarregado);
  });

  it('offline: máximo de 2 perdas por retorno, e o excedente é PERDOADO (não volta no tick seguinte)', () => {
    const s = applyHungerPenalty(faminto(4), T0 + 10 * W);
    expect(s.healthPoints).toBe(3); // 2 × 0,5
    expect(applyHungerPenalty(s, T0 + 10 * W + 60_000)).toBe(s);
    expect(s.hungerPenalty!.paid).toBe(10);
    expect(applyHungerPenalty(s, T0 + 11 * W).healthPoints).toBe(2.5); // a janela nova cobra normalmente
  });

  it('comer (sair do faminto) zera a contagem: a fome seguinte recomeça das 12 h', () => {
    let s = applyHungerPenalty(faminto(), T0 + W); // 2,5
    s = eat(s, T0 + W + H, 40);
    expect(applyHungerPenalty(s, T0 + W + H + 5 * H)).toBe(s); // ...mas não está faminto
    // ele volta a ficar faminto: fome 40 cai a < 20 depois de ~8 h; só ~12 h DEPOIS disso vem a próxima perda
    const desde = starvingSince(s.hunger)!;
    expect(applyHungerPenalty(s, desde + W - 1000)).toBe(s);
    expect(applyHungerPenalty(s, desde + W).healthPoints).toBe(2);
    expect(desde).toBeGreaterThan(T0 + W + H);
  });

  it('nunca abaixo de 1 coração (não mata, não degenera) — e a dívida não vira retroativa', () => {
    const s = applyHungerPenalty(faminto(1.5), T0 + 2 * W);
    expect(s.healthPoints).toBe(1);
    const baixo = applyHungerPenalty(faminto(1), T0 + 5 * W);
    expect(baixo.healthPoints).toBe(1);
    expect(baixo.hungerPenalty!.paid).toBe(5); // se o HP subir depois, não cobra o passado
    expect(applyHungerPenalty({ ...baixo, healthPoints: 3 }, T0 + 5 * W + 1000).healthPoints).toBe(3);
    const meio = applyHungerPenalty(faminto(0.5), T0 + 3 * W);
    expect(meio.healthPoints).toBe(0.5);
  });

  it('só faminto conta: fome mediana/cheia e save sem registro nunca cobram', () => {
    expect(applyHungerPenalty({ healthPoints: 3 } as any, T0 + 99 * W).healthPoints).toBe(3);
    const mediano = { healthPoints: 3, hunger: { v: HUNGER_FAIR_MIN, at: T0 } } as any;
    expect(applyHungerPenalty(mediano, T0 + 1)).toBe(mediano);
  });

  it('a perda alimenta o resumo do dia (`unreported`) e soma entre janelas', () => {
    let s = applyHungerPenalty(faminto(), T0 + W);
    s = applyHungerPenalty(s, T0 + 2 * W);
    expect(s.hungerPenalty!.unreported).toBe(1);
  });

  it('calcula de timestamps: fatiar o tempo não muda o total', () => {
    let a = faminto(5);
    for (let t = T0; t <= T0 + 2 * W + 1; t += 20 * 60_000) a = applyHungerPenalty(a, t);
    const b = applyHungerPenalty(faminto(5), T0 + 2 * W + 1);
    expect(a.healthPoints).toBe(b.healthPoints);
  });

  it('starvingWindows e o aviso de tempo até a próxima perda', () => {
    expect(starvingWindows({ v: 0, at: T0 }, T0 + 25 * H)).toBe(2);
    expect(msToNextHungerLoss(faminto(), T0 + 10 * H)).toBe(2 * H);
    expect(msToNextHungerLoss(faminto(1), T0 + 10 * H)).toBeNull();
  });

  it('lixo no save vira "nada cobrado"', () => {
    for (const lixo of [null, 1, 'x', [], { since: 'a' }, { since: 1 }]) expect(sanitizeHungerPenalty(lixo)).toBeUndefined();
    expect(sanitizeHungerPenalty({ since: 5.9, paid: 2.2, unreported: 99 })).toEqual({ since: 5, paid: 2, unreported: 10 });
  });
});
