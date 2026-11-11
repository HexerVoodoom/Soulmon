import { describe, it, expect } from 'vitest';
import { haFeiraDeVerdade, sortearFeiraLoja } from './_feiraLoja.js';

// Amostragem (11/11/2026, auditoria "voltei e so tinha investigar de novo"): a feira de verdade aparece ~8% das voltas (12% com o buff).
describe('feira de verdade: taxa medida em 10.000 voltas', () => {
  const N = 10000;
  const dia = i => `2026-11-${String(1 + (i % 28)).padStart(2, '0')}`;
  it('~8% sem buff, ~12% com buff, e toda rolagem positiva gera oferta', () => {
    let a = 0, b = 0, o = 0;
    for (let i = 0; i < N; i++) {
      const save = `conta${i}`;
      if (haFeiraDeVerdade(save, dia(i))) a++;
      if (haFeiraDeVerdade(save, dia(i), 4)) b++;
      if (sortearFeiraLoja(save, dia(i))) o++;
    }
    expect(a / N).toBeGreaterThan(0.07); expect(a / N).toBeLessThan(0.09);
    expect(b / N).toBeGreaterThan(0.11); expect(b / N).toBeLessThan(0.13);
    expect(o).toBe(a);
  });
});
