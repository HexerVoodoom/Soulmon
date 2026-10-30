import { describe, it, expect } from 'vitest';
import { SIMULADOS, ART_LINE_BY_ELEMENT } from './_simulados.data.js';
import { ART_LINE_IDS } from './_artLine.js';
import { duelSide } from './_duel.js';
import { saveDoSimulado } from './_simulados.js';
import { CLASS_ELEMENT_ORDER } from '../../src/utils/soulProfile/types';
import { STARTER_ELEMENT } from '../../src/utils/starterElements';

describe('simulados: elemento coerente com a criatura (determinístico, nunca sorteado)', () => {
  it('o elemento é o do SPRITE (prompt da arte): os 8 ids do oráculo, cada um com ao menos 1 simulado', () => {
    const cobertos = new Set(SIMULADOS.map(s => s.element));
    expect([...cobertos].sort()).toEqual(['agua', 'ar', 'fogo', 'industrial', 'luz', 'planta', 'sombra', 'terra']);
    for (const s of SIMULADOS) expect(CLASS_ELEMENT_ORDER).toContain(s.element);
  });
  it('a artLine de fallback só existe quando tem o MESMO elemento (senão vazia) e está na lista fechada', () => {
    for (const s of SIMULADOS) {
      expect(s.artLine, s.id).toBe(ART_LINE_BY_ELEMENT[s.element] ?? '');
      if (s.artLine) expect(ART_LINE_IDS.has(s.artLine)).toBe(true);
    }
  });
  it('inicial como arte => o elemento é o do inicial (terra/som/ar/vida/fogo)', () => {
    for (const [linha, el] of Object.entries(STARTER_ELEMENT)) {
      for (const s of SIMULADOS.filter(x => x.artLine === linha)) expect(s.element, s.id).toBe(el);
    }
  });
  it('ids únicos e estáveis (sim_0001..sim_0050)', () => {
    expect(SIMULADOS.map(s => s.id)).toEqual(Array.from({ length: 50 }, (_, i) => `sim_${String(i + 1).padStart(4, '0')}`));
    expect(duelSide).toBeTypeOf('function');
  });
  it('duelo: fx.elBasica do simulado é o elemento dele, em todo dia, sem mexer nos stats', () => {
    for (const s of SIMULADOS) for (const dia of ['2026-10-25', '2026-12-01']) {
      const save = saveDoSimulado(s, dia);
      const a = duelSide(save), b = duelSide(save);
      expect(a.fx.elBasica, s.id).toBe(s.element);
      expect(a).toEqual(b);
      const { soulmonSkills, ...semSkills } = save;
      expect(duelSide(semSkills).combatant).toEqual(a.combatant);
    }
  });
});
