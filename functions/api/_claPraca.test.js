import { describe, it, expect } from 'vitest';
import { fakeKV, seeded } from './_claKv.testkit.js';
import {
  PRESENTE_PESOS, PRESENTE_DECOR, PRESENTE_CHIPS, PRESENTE_BITS_MIN, PRESENTE_BITS_MAX, sortearPresente, sortearPonderado,
  definirSlotPraca, lerPraca, enviarPresente, presentesPendentes, resgatarPresente, presenteVale,
} from './_claPraca.js';

const env = () => ({ DIGIAPP_SAVES: fakeKV() });
const A = 'saveA', B = 'saveB', C = 'saveC', M = [A, B, C], G = 'g1';

describe('praça: pesos do presente (G-01)', () => {
  it('soma 1000 e chip + comida <= 5%', () => {
    const t = Object.values(PRESENTE_PESOS).reduce((s, n) => s + n, 0);
    expect(t).toBe(1000);
    expect((PRESENTE_PESOS.chip + PRESENTE_PESOS.food) / t).toBeLessThanOrEqual(0.05);
    expect(PRESENTE_PESOS.decor + PRESENTE_PESOS.bits).toBeGreaterThanOrEqual(0.95 * t);
  });
  it('sortearPonderado respeita as fronteiras', () => {
    expect(sortearPonderado({ a: 1, b: 1 }, 0)).toBe('a');
    expect(sortearPonderado({ a: 1, b: 1 }, 0.5)).toBe('b');
    expect(sortearPonderado({ a: 1, b: 1 }, 0.9999)).toBe('b');
  });
  it('sorteio com seed é determinístico, válido e a taxa de chip+comida fica perto de 5%', () => {
    const r1 = seeded(7), r2 = seeded(7);
    const a = Array.from({ length: 20 }, () => sortearPresente(r1));
    const b = Array.from({ length: 20 }, () => sortearPresente(r2));
    expect(a).toEqual(b);
    const r = seeded(42);
    let raros = 0; const N = 20000;
    for (let i = 0; i < N; i++) {
      const p = sortearPresente(r);
      if (p.kind === 'chip') { raros++; expect(PRESENTE_CHIPS).toContain(p.id); }
      else if (p.kind === 'food') raros++;
      else if (p.kind === 'bits') { expect(p.amount).toBeGreaterThanOrEqual(PRESENTE_BITS_MIN); expect(p.amount).toBeLessThanOrEqual(PRESENTE_BITS_MAX); }
      else { expect(p.kind).toBe('decor'); expect(PRESENTE_DECOR).toContain(p.id); }
    }
    expect(raros / N).toBeGreaterThan(0.03);
    expect(raros / N).toBeLessThan(0.07);
  });
});

describe('praça: slots', () => {
  it('4 slots, guarda quem pôs, troca e tira; recusa slot/item inválido', async () => {
    const e = env();
    expect((await lerPraca(e, G)).slots).toEqual([null, null, null, null]);
    await definirSlotPraca(e, G, A, '2026-10-18', 0, 'furn-lamp');
    await definirSlotPraca(e, G, B, '2026-10-18', 0, 'furn-rug'); // B troca o de A
    await definirSlotPraca(e, G, B, '2026-10-18', 3, 'furn-plant');
    const p = await lerPraca(e, G);
    expect(p.slots[0]).toMatchObject({ item: 'furn-rug', by: B });
    expect(p.slots[3]).toMatchObject({ item: 'furn-plant', by: B });
    await definirSlotPraca(e, G, A, '2026-10-18', 3, null);
    expect((await lerPraca(e, G)).slots[3]).toBeNull();
    for (const slot of [-1, 4, 1.5, '1', null]) expect(await definirSlotPraca(e, G, A, '2026-10-18', slot, 'furn-lamp')).toBeUndefined();
    for (const item of ['', 'A B', '../x', 7, undefined]) expect(await definirSlotPraca(e, G, A, '2026-10-18', 1, item)).toBeUndefined();
  });
});

describe('praça: presente', () => {
  it('1x por dia por par A->B (2º é bloqueado); B->A e A->C seguem livres; no dia seguinte volta', async () => {
    const e = env();
    const rng = seeded(1);
    expect((await enviarPresente(e, G, A, B, '2026-10-18', rng)).ok).toBe(true);
    expect(await enviarPresente(e, G, A, B, '2026-10-18', rng)).toEqual({ ok: false, reason: 'already-sent' });
    expect((await enviarPresente(e, G, B, A, '2026-10-18', rng)).ok).toBe(true);
    expect((await enviarPresente(e, G, A, C, '2026-10-18', rng)).ok).toBe(true);
    expect((await enviarPresente(e, G, A, B, '2026-10-19', rng)).ok).toBe(true);
    expect(await enviarPresente(e, G, A, A, '2026-10-19', rng)).toEqual({ ok: false, reason: 'self' });
  });
  it('B vê o pendente, resgata UMA vez, e o presente vence depois da janela', async () => {
    const e = env();
    await enviarPresente(e, G, A, B, '2026-10-18', seeded(3));
    await enviarPresente(e, G, A, B, '2026-10-19', seeded(4));
    const pend = await presentesPendentes(e, G, B, M, '2026-10-19');
    expect(pend.map(p => p.day)).toEqual(['2026-10-18', '2026-10-19']);
    expect(await presentesPendentes(e, G, A, M, '2026-10-19')).toEqual([]);
    const r = await resgatarPresente(e, G, B, M, A, '2026-10-18', '2026-10-19');
    expect(r.ok).toBe(true);
    expect(r.item.kind).toBeTruthy();
    const outra = await resgatarPresente(e, G, B, M, A, '2026-10-18', '2026-10-19');
    expect(outra).toMatchObject({ ok: true, repeat: true, receipt: r.receipt, item: r.item }); // reentregável
    expect((await presentesPendentes(e, G, B, M, '2026-10-19')).map(p => p.day)).toEqual(['2026-10-19']);
    expect(await presentesPendentes(e, G, B, M, '2026-10-22')).toEqual([]); // venceu (3 dias)
    expect(presenteVale('2026-10-18', '2026-10-20')).toBe(true);
    expect(presenteVale('2026-10-18', '2026-10-21')).toBe(false);
  });
  it('G-01 agregado: no máximo 1 presente raro por destinatário por semana; semana nova libera', async () => {
    const e = env();
    const fila = valores => { let i = 0; return () => valores[i++ % valores.length]; };
    const raro = () => fila([0.96, 0.1]);      // chip
    const r1 = await enviarPresente(e, G, A, B, '2026-10-19', raro(), M);
    expect(r1.ok).toBe(true);
    await enviarPresente(e, G, C, B, '2026-10-20', raro(), M); // cairia raro, B já tem 1 na semana
    const pend = await presentesPendentes(e, G, B, M, '2026-10-20');
    expect(pend.map(p => p.item.kind)).toEqual(['chip', 'decor']);
    await enviarPresente(e, G, A, B, '2026-10-26', raro(), M); // semana ISO seguinte
    expect((await presentesPendentes(e, G, B, M, '2026-10-26')).map(p => p.item.kind)).toEqual(['chip']); // os anteriores já venceram; o raro da semana nova passa
  });
  it('recibo inclui gid e destinatário (ids opacos)', async () => {
    const e = env();
    await enviarPresente(e, G, A, B, '2026-10-18', seeded(3), M);
    const r = await resgatarPresente(e, G, B, M, A, '2026-10-18', '2026-10-18', { [A]: 'oa', [B]: 'ob' });
    expect(r.receipt).toBe('g1|ob|oa|2026-10-18');
  });
  it('não resgata o que não é seu nem presente inexistente', async () => {
    const e = env();
    await enviarPresente(e, G, A, B, '2026-10-18', seeded(3));
    expect((await resgatarPresente(e, G, C, M, A, '2026-10-18', '2026-10-18')).ok).toBe(false);
    expect((await resgatarPresente(e, G, B, M, C, '2026-10-18', '2026-10-18')).ok).toBe(false);
  });
});
