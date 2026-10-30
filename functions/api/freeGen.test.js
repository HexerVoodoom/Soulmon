import { describe, it, expect } from 'vitest';
import { freeRookie, freeGenKey } from './_freeGen.js';
import { isVeladoTester, veladoTesterHash } from './_velado.js';

const kv = () => { const m = new Map(); return { m, get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); } }; };

describe('freeRookie', () => {
  it('2ª chamada devolve a MESMA URL e não gera de novo', async () => {
    const s = kv(); let n = 0;
    const gen = async () => ({ image: `https://x/${++n}.png` });
    const a = await freeRookie(s, 'abc', gen);
    const b = await freeRookie(s, 'abc', gen);
    expect(a).toEqual({ image: 'https://x/1.png', cached: false });
    expect(b).toEqual({ image: 'https://x/1.png', cached: true });
    expect(n).toBe(1);
    expect(s.m.has(freeGenKey('abc'))).toBe(true);
  });
  it('falha do provedor = fallback e nada gravado', async () => {
    const s = kv();
    expect(await freeRookie(s, 'abc', async () => { throw new Error('x'); })).toEqual({ image: null, fallback: true });
    expect(await freeRookie(s, 'abc', async () => null)).toEqual({ image: null, fallback: true });
    expect(s.m.size).toBe(0);
  });
});

describe('interruptor por pessoa (servidor)', () => {
  it('só quem está na lista de hashes; vazia = ninguém', async () => {
    const h = await veladoTesterHash(' Teste@X.com ');
    expect(await isVeladoTester({ ONBOARDING_VELADO_TESTERS: `zzz, ${h}` }, 'teste@x.com')).toBe(true);
    expect(await isVeladoTester({ ONBOARDING_VELADO_TESTERS: h }, 'outro@x.com')).toBe(false);
    expect(await isVeladoTester({}, 'teste@x.com')).toBe(false);
    expect(await isVeladoTester({ ONBOARDING_VELADO_TESTERS: h }, null)).toBe(false);
  });
});
