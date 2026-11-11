import { describe, it, expect } from 'vitest';
import { sortearEncontro, resolverEncontro, achadoDoDia, desafioK, ehDesafioK, eventoDoDesafio, estadoDoDesafio, DESAFIO_K0, ACHADO_BITS_MIN, ACHADO_BITS_MAX } from './_encontro.js';
import { haFeiraDeVerdade, sortearFeiraLoja } from './_feiraLoja.js';
import { DESAFIO_BITS_CLA, somarBitsDesafio, lerCasa, bitsDaCasa } from './_casa.js';
import { CASA_BITS_POR_DIA } from './_casa.js';

const dia = i => `2026-11-${String(1 + (i % 28)).padStart(2, '0')}`;
const N = 10000;

describe('encontro da volta: sorteio puro', () => {
  it('determinístico por (conta, dia) e a chance do Mercador é a de sempre', () => {
    for (let i = 0; i < 200; i++) expect(sortearEncontro(`c${i}`, dia(i))).toBe(sortearEncontro(`c${i}`, dia(i)));
    for (let i = 0; i < 500; i++) expect(sortearEncontro(`c${i}`, dia(i)) === 'mercador').toBe(haFeiraDeVerdade(`c${i}`, dia(i)));
  });
  it('resolver: sempre um encontro, e o achado só se nada abrir', () => {
    expect(resolverEncontro('chefe', { mercador: false, desafio: true, chefe: false })).toBe('desafio');
    expect(resolverEncontro('desafio', { mercador: false, desafio: false, chefe: true })).toBe('chefe');
    expect(resolverEncontro('mercador', { mercador: false, desafio: false, chefe: true })).toBe('chefe');
    expect(resolverEncontro('chefe', { mercador: false, desafio: false, chefe: false })).toBe('achado');
    expect(resolverEncontro('mercador', { mercador: true, desafio: true, chefe: true })).toBe('mercador');
  });
  it('achado: Bits pequenos e determinísticos', () => {
    for (let i = 0; i < 300; i++) { const a = achadoDoDia(`c${i}`, dia(i)); expect(a.bits).toBeGreaterThanOrEqual(ACHADO_BITS_MIN); expect(a.bits).toBeLessThanOrEqual(ACHADO_BITS_MAX); expect(achadoDoDia(`c${i}`, dia(i))).toEqual(a); }
  });
  it('desafio sintético: k acima de qualquer mistério real e dentro do limite do cliente', () => {
    for (let i = 0; i < 28; i++) { const k = desafioK(dia(i)); expect(ehDesafioK(k)).toBe(true); expect(k).toBeLessThanOrEqual(1_000_000); }
    expect(desafioK('2026-11-11')).not.toBe(desafioK('2026-11-12'));
    expect(ehDesafioK(12)).toBe(false);
    expect(eventoDoDesafio('2026-11-11', 3).trail.pending).toBe(true);
    expect(estadoDoDesafio('2026-11-11', 3).desafio).toBe(true);
    expect(DESAFIO_K0).toBe(500000);
  });
});

describe('encontro da volta: 10.000 voltas (funções reais)', () => {
  const rodar = (chefeAbre, bonus = 0) => {
    const c = { mercador: 0, desafio: 0, chefe: 0, achado: 0 };
    for (let i = 0; i < N; i++) {
      const save = `conta${i}`, d = dia(i);
      const mercadorAbre = !!sortearFeiraLoja(save, d, new Set(), bonus);
      c[resolverEncontro(sortearEncontro(save, d, bonus), { mercador: mercadorAbre, desafio: true, chefe: chefeAbre(i) })]++;
    }
    return c;
  };
  it('com o chefe sempre aberto: ~8 / ~25 / ~67 / 0', () => {
    const c = rodar(() => true);
    console.log('DISTRIBUICAO (chefe sempre aberto)', JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, (v / N * 100).toFixed(2) + '%']))));
    expect(c.mercador / N).toBeGreaterThan(0.07); expect(c.mercador / N).toBeLessThan(0.09);
    expect(c.desafio / N).toBeGreaterThan(0.23); expect(c.desafio / N).toBeLessThan(0.27);
    expect(c.chefe / N).toBeGreaterThan(0.65); expect(c.chefe / N).toBeLessThan(0.69);
    expect(c.achado).toBe(0);
  });
  it('com o buff do clã: ~12% de Mercador e desafio ~25%', () => {
    const c = rodar(() => true, 4);
    expect(c.mercador / N).toBeGreaterThan(0.11); expect(c.mercador / N).toBeLessThan(0.13);
    expect(c.desafio / N).toBeGreaterThan(0.23); expect(c.desafio / N).toBeLessThan(0.27);
  });
  it('com o chefe fechado em metade dos dias: o desafio absorve, nunca zero encontro e achado só se o desafio também fechar', () => {
    const c = rodar(i => i % 2 === 0);
    console.log('DISTRIBUICAO (chefe aberto em 50%)', JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, (v / N * 100).toFixed(2) + '%']))));
    expect(c.mercador + c.desafio + c.chefe + c.achado).toBe(N);
    expect(c.achado).toBe(0);
    const t = (() => { const x = { mercador: 0, desafio: 0, chefe: 0, achado: 0 }; for (let i = 0; i < N; i++) x[resolverEncontro(sortearEncontro(`c${i}`, dia(i)), { mercador: false, desafio: false, chefe: false })]++; return x; })();
    expect(t.achado).toBe(N);
  });
});

describe('desafio: Bits do clã', () => {
  const kv = () => { const m = new Map(); return { SOULMON_SAVES: { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); } } }; };
  it('10 Bits, 1× por dia por pessoa (idempotente) e entram no tesouro; teto = 10% da doação máxima', async () => {
    const env = kv();
    expect(await somarBitsDesafio(env, 'g1', 's1', '2026-11-11')).toBe(DESAFIO_BITS_CLA);
    expect(await somarBitsDesafio(env, 'g1', 's1', '2026-11-11')).toBe(0);
    expect(await somarBitsDesafio(env, 'g1', 's1', '2026-11-10')).toBe(0);
    expect(await somarBitsDesafio(env, 'g1', 's1', '2026-11-12')).toBe(DESAFIO_BITS_CLA);
    const casa = await lerCasa(env, 'g1', 's1');
    expect(casa.desafioBits).toBe(20);
    expect(bitsDaCasa({ members: ['s1'] }, { s1: { casa } })).toBe(20);
    expect(DESAFIO_BITS_CLA).toBeLessThanOrEqual(CASA_BITS_POR_DIA / 10);
  });
});
