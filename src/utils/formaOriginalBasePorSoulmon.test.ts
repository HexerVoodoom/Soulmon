/**
 * A forma ORIGINAL é o elemento BASE DO PRÓPRIO Soulmon (Oráculo), nunca um valor fixo; a de poção é o elemento daquela poção (10/11/2026).
 * Duas contas: base sombra (a do dono, poção que virou Sabá) e base terra com poção de ar.
 */
import { describe, it, expect } from 'vitest';
import { equiparFormaAltEstado, trocarFormaEstado, type EstadoDeForma } from './formaEquip';
import { sanitizeFormaSnapshots } from './formaSnapshot';
import { petElementOf } from './starterElements';

type S = EstadoDeForma & { unlockedEvolutions: string[] };
const conta = (base: string, pocao: string, elementoDaPocao: string): S => ({
  evolutionStage: 'ultimate-harmony',
  unlockedEvolutions: ['rookie', 'champion-power', 'champion-harmony', 'ultimate-harmony', 'ultimate-power'],
  potionElement: 'fada',
  // o registro do estágio pode ter qualquer coisa (aqui, o elemento composto da poção): a original NÃO lê dele
  elementoJornada: { v: 1, u: 0.5, estagios: { ultimate: { id: elementoDaPocao, base } } },
  soulmonMeta: { dominantElement: base },
  formasAlt: { 'ultimate-power': ['original', pocao], 'ultimate-harmony': ['fada'] },
  formaAltEquipada: { 'ultimate-power': pocao, 'ultimate-harmony': 'fada' },
  formaSnapshots: sanitizeFormaSnapshots({
    'ultimate-harmony@fada': { pocao: 'fada' },
    [`ultimate-power@${pocao}`]: { pocao, elemento: { id: elementoDaPocao, base } },
    'ultimate-power@original': { pocao: 'fada', elemento: { id: elementoDaPocao, base } }, // contaminado
  }),
} as never);

describe('original = base do PRÓPRIO Soulmon; poção = elemento da poção', () => {
  for (const [base, pocao, elDaPocao] of [['sombra', 'sabbat', 'sabbat'], ['terra', 'ar', 'ar']] as const) {
    it(`base ${base} + poção ${pocao}`, () => {
      const s = conta(base, pocao, elDaPocao);
      const original = trocarFormaEstado(s, 'ultimate-power', 'original');
      expect(original.formaAltEquipada?.['ultimate-power']).toBe('original');
      expect(petElementOf(original as never)).toBe(base);
      const dePocao = equiparFormaAltEstado(original, 'ultimate-power', pocao); // mesma forma (já é a atual): equipar, não trocar de galho
      expect(petElementOf(trocarFormaEstado(s, 'ultimate-power', pocao) as never)).toBe(elDaPocao);
      expect(petElementOf(dePocao as never)).toBe(elDaPocao);
      expect(dePocao.formaAltEquipada?.['ultimate-power']).toBe(pocao);
      expect(petElementOf(trocarFormaEstado(original, 'ultimate-harmony', 'fada') as never)).toBe('fada');
    });
  }
  it('sem soulmonMeta, usa o base gravado no registro do estágio (nunca fixo)', () => {
    const s = { ...conta('terra', 'ar', 'ar'), soulmonMeta: undefined } as S;
    expect(petElementOf(trocarFormaEstado(s, 'ultimate-power', 'original') as never)).toBe('terra');
  });
});
