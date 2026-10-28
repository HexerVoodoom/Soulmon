import { describe, it, expect } from 'vitest';
import { SIMULADOS, ART_LINE_BY_ELEMENT } from './_simulados.data.js';
import { ART_LINE_IDS } from './_artLine.js';
import { duelSide } from './_duel.js';
import { NOVOS_DATA } from '../../src/utils/novosSoulmonData';
import { CLASS_ELEMENT_ORDER } from '../../src/utils/soulProfile/types';
import { STARTER_ELEMENT } from '../../src/utils/starterElements';

describe('simulados: elemento coerente com a criatura (determinístico, nunca sorteado)', () => {
  it('cobrem os 20 elementos base, cada um com ao menos 1 simulado', () => {
    const cobertos = new Set(SIMULADOS.map(s => s.element));
    expect([...cobertos].sort()).toEqual([...CLASS_ELEMENT_ORDER].sort());
  });
  it('a linha (poder/harmonia/benevolência) é a da criatura base do elemento', () => {
    const linhaDe = Object.fromEntries(NOVOS_DATA.map(n => [n.element, n.line]));
    for (const s of SIMULADOS) expect(s.line, `${s.id} ${s.element}`).toBe(linhaDe[s.element]);
  });
  it('a artLine de fallback é DERIVADA do elemento e existe na lista fechada', () => {
    expect(Object.keys(ART_LINE_BY_ELEMENT).sort()).toEqual([...CLASS_ELEMENT_ORDER].sort());
    for (const s of SIMULADOS) {
      expect(s.artLine, s.id).toBe(ART_LINE_BY_ELEMENT[s.element]);
      expect(ART_LINE_IDS.has(s.artLine)).toBe(true);
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
});
