// Prompts dos simulados saem do Oráculo real (REGISTRO §231): determinísticos por id e com o elemento e a linha pedidos.
import { describe, it, expect } from 'vitest';
import { promptsDoSimulado } from '../../scripts/simulados-prompts';
import { SIMULADOS } from '../../functions/api/_simulados.data.js';

describe('prompts dos simulados pelo Oráculo', () => {
  const p = SIMULADOS.find((s) => s.id === 'sim_0065')!;
  it('as 5 formas da linha, reprodutíveis e sem texto próprio', async () => {
    const a = await promptsDoSimulado(p);
    const b = await promptsDoSimulado(p);
    expect(a).toEqual(b);
    expect(Object.keys(a)).toEqual(['rookie', 'champion-power', 'ultimate-power', 'mega-power', 'ultra']);
    for (const f of Object.values(a)) {
      expect(f.prompt).toMatch(/#00FF00|#FF00FF/);
      expect(f.prompt).toContain('Do not copy any existing franchise character');
      expect(f.fallback).toBeTruthy();
    }
    expect(a.rookie.prompt).toContain('POWER-attribute');
  }, 120_000);
});
