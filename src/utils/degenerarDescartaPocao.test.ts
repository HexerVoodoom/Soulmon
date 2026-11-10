/**
 * Regra do dono (10/11/2026): degenerar DESCARTA a poção — o Soulmon volta ao elemento base do nível; a poção só vale para a
 * evolução em que foi usada. Vale para Ultimate→Champion, Mega→Ultimate, Champion→Rookie. E o save já contaminado é curado.
 */
import { describe, it, expect } from 'vitest';
import { aoDescerDeForma } from './formaSnapshot';
import { curarPocaoOrfa } from './elementPotion';
import { petElementOf } from './starterElements';

const est = (id: string) => ({ id, base: id });
const base = (stage: string): any => ({
  evolutionStage: stage, potionElement: 'fada',
  elementoJornada: { v: 1, u: 0.5, estagios: { rookie: est('sombra'), champion: est('sombra'), ultimate: est('sombra'), mega: est('sombra') } },
  formaAltEquipada: { [stage]: 'fada' },
});

describe('degenerar descarta a poção', () => {
  for (const [de, para] of [['ultimate-power', 'champion-power'], ['mega-harmony', 'ultimate-harmony'], ['champion-power', 'rookie']] as const) {
    it(`${de} → ${para}: volta ao elemento base (sombra), mesmo com foto do destino com poção`, () => {
      const prev = { ...base(de), formaSnapshots: { [para]: { pocao: 'marcial' }, [`${para}@fada`]: { pocao: 'fada' } } };
      expect(petElementOf(prev)).toBe('fada');
      const caiu = aoDescerDeForma(prev, { ...prev, evolutionStage: para });
      expect(caiu.potionElement).toBeUndefined();
      expect(petElementOf(caiu)).toBe('sombra');
    });
  }
});

describe('migração: potionElement fora da forma a que pertence', () => {
  it('poção que não é o elemento equipado da forma atual é descartada', () => {
    expect(curarPocaoOrfa('fada', 'champion-power', { 'champion-power': 'sombra' })).toBeUndefined();
  });
  it('poção que é o elemento equipado da forma fica; sem equipado (save antigo) também', () => {
    expect(curarPocaoOrfa('fada', 'ultimate-harmony', { 'ultimate-harmony': 'fada' })).toBe('fada');
    expect(curarPocaoOrfa('fada', 'ultimate-harmony', undefined)).toBe('fada');
    expect(curarPocaoOrfa(undefined, 'rookie', undefined)).toBeUndefined();
  });
});
