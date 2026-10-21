import { describe, it, expect } from 'vitest';
import { minimizeForAi } from './_redact.js';

// L07-02: regex quadráticas rodavam sobre a entrada INTEIRA antes do truncamento.
describe('L07-02: minimizeForAi corta a entrada antes das regex', () => {
  it('40k dígitos terminam rápido', () => {
    const t0 = performance.now();
    const r = minimizeForAi('1 '.repeat(20000), 300);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(200);
    expect(r.truncated).toBe(true);
    expect(r.text.length).toBeLessThanOrEqual(300);
  });
  it('80k caracteres de e-mail-bait terminam rápido', () => {
    const t0 = performance.now();
    minimizeForAi('a'.repeat(80000), 300);
    expect(performance.now() - t0).toBeLessThan(200);
  });
  it('identificador que cruza o limite ainda é redigido', () => {
    const r = minimizeForAi('x'.repeat(295) + ' joao.silva@gmail.com', 300);
    expect(r.text).not.toContain('@gmail');
    expect(r.truncated).toBe(true);
  });
});
