/** 💤 Dormir dá ×1,5 na regeneração da energia (REGISTRO §277). Pura: `now` por parâmetro. */
import { describe, it, expect } from 'vitest';
import {
  SLEEP_ENERGY_REGEN_BONUS, ENERGY_REGEN_MINUTES, UNIT_POINTS, energyStatus, sanitizeEnergyClock, setSleeping, settleEnergy, regenPoints,
  type HungerState,
} from './hunger';

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 10, 22, 0, 0);
const novo = (over: Partial<HungerState> = {}): HungerState => ({ energyPoints: 0, evolutionStage: 'rookie', energyClock: { at: T0, carry: 0 }, ...over });
const dorme = (): HungerState => novo({ energyClock: { at: T0, carry: 0, sleep: true } });

describe('bônus de sono da energia', () => {
  it('a constante é 1,5', () => expect(SLEEP_ENERGY_REGEN_BONUS).toBe(1.5));

  it('dormindo, bem alimentado regenera ×1,5 (1 unidade a cada 80/1,5 ≈ 53 min em vez de 80)', () => {
    const sono = Math.ceil((ENERGY_REGEN_MINUTES * MIN) / SLEEP_ENERGY_REGEN_BONUS);
    expect(settleEnergy(dorme(), T0 + sono).energyPoints).toBe(1);
    expect(settleEnergy(novo(), T0 + sono).energyPoints).toBe(0);
    expect(settleEnergy(dorme(), T0 + 6 * ENERGY_REGEN_MINUTES * MIN).energyPoints).toBe(8); // 6 unidades acordado × 1,5 = 9, teto 8
  });

  it('mediano dormindo = 75%; faminto continua 0%', () => {
    const fair = { v: 40, at: T0 }; // mediano pelas próximas horas
    expect(settleEnergy({ ...dorme(), hunger: fair }, T0 + 107 * MIN).energyPoints).toBe(1); // 107 × 0,75 ≈ 80
    const fome = { ...dorme(), hunger: { v: 0, at: T0 } };
    expect(settleEnergy(fome, T0 + 10 * 60 * MIN).energyPoints).toBe(0);
    expect(energyStatus(fome, T0 + MIN).mode).toBe('paused');
  });

  it('energyStatus: velocidade ×1,5 e o timer projeta ×1,5', () => {
    const acordado = energyStatus(novo(), T0);
    const dormindo = energyStatus(dorme(), T0);
    expect(acordado.speed).toBe(100);
    expect(dormindo.speed).toBe(150);
    expect(dormindo.sleeping).toBe(true);
    expect(acordado.msToNext).toBe(ENERGY_REGEN_MINUTES * MIN);
    expect(dormindo.msToNext).toBe((ENERGY_REGEN_MINUTES * MIN) / SLEEP_ENERGY_REGEN_BONUS);
  });

  it('troca de estado no meio da unidade: contada por trechos (50 min acordado + 20 min dormindo = 1 unidade de 80)', () => {
    let s = novo();
    s = setSleeping(s, T0 + 50 * MIN, true); // acerta os 50 min com o estado antigo (acordado)
    expect(s.energyPoints).toBe(0);
    expect(s.energyClock?.sleep).toBe(true);
    expect(s.energyClock?.carry).toBe(50 * MIN * 100);
    expect(settleEnergy(s, T0 + 70 * MIN).energyPoints).toBe(1); // 50 + 20 × 1,5 = 80
    expect(settleEnergy(s, T0 + 69 * MIN).energyPoints).toBe(0);
    // volta a acordar: o trecho dormido conta ×1,5 e o resto ×1
    const acordou = setSleeping(s, T0 + 60 * MIN, false); // 50 + 10 × 1,5 = 65 min-equivalentes
    expect(acordou.energyClock?.sleep).toBeUndefined();
    expect(acordou.energyClock?.carry).toBe(65 * MIN * 100);
    expect(settleEnergy(acordou, T0 + 75 * MIN).energyPoints).toBe(1);
  });

  it('fatiar o tempo não muda o total dormindo (leitura a cada 20 s = uma vez só)', () => {
    let a = dorme();
    for (let t = T0 + 20_000; t <= T0 + 3 * 60 * MIN; t += 20_000) a = settleEnergy(a, t);
    const b = settleEnergy(dorme(), T0 + 3 * 60 * MIN);
    expect(a.energyPoints).toBe(b.energyPoints);
    expect(regenPoints(undefined, T0, T0 + 3 * 60 * MIN, undefined, true)).toBe(3 * 60 * MIN * 150);
  });

  it('idempotência: mesmo estado = mesma referência; repetir a troca não muda nada', () => {
    const d = dorme();
    expect(setSleeping(d, T0 + 5 * MIN, true)).toBe(d);
    const a = novo();
    expect(setSleeping(a, T0 + 5 * MIN, false)).toBe(a);
    const s1 = setSleeping(a, T0 + 5 * MIN, true);
    expect(setSleeping(s1, T0 + 9 * MIN, true)).toBe(s1);
  });

  it('energia cheia: o relógio fica parado e o estado de sono é mantido ao re-ancorar', () => {
    const cheia = { ...dorme(), energyPoints: 8 };
    const r = settleEnergy(cheia, T0 + 31 * MIN);
    expect(r.energyPoints).toBe(8);
    expect(r.energyClock).toEqual({ at: T0 + 31 * MIN, carry: 0, sleep: true });
  });

  it('save: sanitizador tolerante (sleep só quando === true; lixo vira acordado)', () => {
    expect(sanitizeEnergyClock({ at: 5, carry: 1, sleep: true })).toEqual({ at: 5, carry: 1, sleep: true });
    expect(sanitizeEnergyClock({ at: 5, carry: 1, sleep: 'sim' })).toEqual({ at: 5, carry: 1 });
    expect(sanitizeEnergyClock({ at: 5, carry: 1 })).toEqual({ at: 5, carry: 1 });
  });

  it('a unidade não mudou (ponto-ms)', () => expect(UNIT_POINTS).toBe(ENERGY_REGEN_MINUTES * MIN * 100));
});
