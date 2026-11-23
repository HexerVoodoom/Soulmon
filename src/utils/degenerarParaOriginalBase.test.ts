/**
 * QA 10/11/2026: cair (degenerar) para uma forma com a ORIGINAL equipada deve assumir o elemento BASE do Soulmon
 * (`soulmonMeta.dominantElement`), não o elemento combinado do registro do nível — igual à troca de forma.
 */
import { describe, it, expect } from 'vitest';
import { aoDescerDeForma } from './formaSnapshot';
import { petElementOf } from './starterElements';

const conta = (base: string, registroNivel: string): any => ({
  evolutionStage: 'mega-power', potionElement: 'fada',
  soulmonMeta: { dominantElement: base },
  elementoJornada: { v: 1, u: 0.5, estagios: { ultimate: { id: registroNivel, base }, mega: { id: 'fada', base } } },
  formasAlt: { 'ultimate-power': ['original', 'sabbat'], 'mega-power': ['fada'] },
  formaAltEquipada: { 'ultimate-power': 'original', 'mega-power': 'fada' },
  formaSnapshots: { 'ultimate-power@original': { elemento: { id: registroNivel, base } }, 'mega-power@fada': { pocao: 'fada' } },
});

describe('degenerar para a forma original', () => {
  for (const [base, composto] of [['sombra', 'sabbat'], ['terra', 'ar']] as const) {
    it(`base ${base}, registro do nível ${composto}: o elemento é ${base}`, () => {
      const prev = conta(base, composto);
      expect(petElementOf(prev)).toBe('fada');
      const caiu = aoDescerDeForma(prev, { ...prev, evolutionStage: 'ultimate-power' });
      expect(petElementOf(caiu)).toBe(base);
      expect(caiu.formaAltEquipada['ultimate-power']).toBe('original');
    });
  }
  it('conta que nunca usou poção não é tocada (no-op)', () => {
    const prev = { ...conta('sombra', 'sombra'), potionElement: undefined, formaSnapshots: {} };
    const caiu = aoDescerDeForma(prev, { ...prev, evolutionStage: 'ultimate-power' });
    expect(caiu.potionElement).toBeUndefined();
  });
});
