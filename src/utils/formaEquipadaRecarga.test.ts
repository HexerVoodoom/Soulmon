/**
 * BUG do dono (11/11/2026): evolui a forma base (Sombra), degenera, evolui a MESMA forma por poção (Sabá), equipa a original,
 * fecha e abre o app: a forma equipada segue a original, mas o elemento (e, por ele, o tipo de ataque) volta a ser o da poção.
 * O estado VIVO está certo; o que quebrava era o carregamento (`hydrateSave`).
 */
import { describe, it, expect } from 'vitest';
import { hidratarNuvem } from '../contexts/GameStateContext';
import { aoDescerDeForma, capturarForma } from './formaSnapshot';
import { equiparFormaAltEstado } from './formaEquip';
import { applyPotionOnEvolve } from './elementPotion';
import { registrarFormaAoEvoluir } from './formasAlternativas';
import { petElementOf } from './starterElements';
import { elementStrikeForm } from './combatFx';

const ev = (prev: any, stage: string, pocao?: string, elReg = 'sombra'): any => {
  const base = applyPotionOnEvolve({ ...capturarForma(prev), evolutionPotion: pocao });
  const evolved = {
    ...base, evolutionStage: stage,
    elementoJornada: { v: 1, u: 0.5, estagios: { ...(prev.elementoJornada?.estagios ?? {}), ultimate: prev.elementoJornada?.estagios?.ultimate ?? { id: elReg, base: 'sombra' } } },
  };
  return { ...evolved, ...registrarFormaAoEvoluir(prev.formasAlt, prev.formaAltEquipada, stage, evolved.potionElement ?? elReg) };
};
const recarrega = (s: any) => hidratarNuvem(JSON.parse(JSON.stringify(s)));

function cenario(equipar: string) {
  let s: any = {
    evolutionStage: 'champion-power', soulmonMeta: { dominantElement: 'sombra' },
    unlockedEvolutions: ['rookie', 'champion-power', 'ultimate-power'],
    elementoJornada: { v: 1, u: 0.5, estagios: { rookie: { id: 'sombra', base: 'sombra' } } },
  };
  s = ev(s, 'ultimate-power');
  const queda = { ...s, evolutionStage: 'champion-power' };
  s = aoDescerDeForma(s, queda);
  s = ev(s, 'ultimate-power', 'sabbat', 'sabbat');
  // Save com arte antiga (de antes da lista de formas): a 1ª entrada é o sentinela `original`.
  if (equipar === 'original') s = { ...s, formasAlt: { 'ultimate-power': ['original', 'sabbat'] } };
  return equiparFormaAltEstado(s, 'ultimate-power', equipar);
}

describe.each(['sombra', 'original'])('recarregar com a forma %s equipada', (eq) => {
  it('o elemento efetivo não muda ao fechar e abrir o app', () => {
    const vivo = cenario(eq);
    const carregado = recarrega(vivo);
    expect(carregado.formaAltEquipada?.['ultimate-power']).toBe(eq);
    expect(petElementOf(carregado)).toBe(petElementOf(vivo));
    expect(petElementOf(carregado)).toBe('sombra');
    expect(elementStrikeForm(petElementOf(carregado), 'basica')).toBe(elementStrikeForm(petElementOf(vivo), 'basica'));
  });
});

describe('save JÁ afetado (potionElement base perdido na gravação anterior)', () => {
  it('é curado ao carregar a partir da forma equipada, sem apagar dados', () => {
    const vivo = cenario('original');
    const quebrado = { ...vivo, potionElement: undefined };
    const carregado = recarrega(quebrado);
    expect(petElementOf(carregado)).toBe('sombra');
    expect(carregado.formaSnapshots).toEqual(recarrega(vivo).formaSnapshots);
    expect(carregado.formasAlt).toEqual(vivo.formasAlt);
  });
  it('é idempotente: carregar duas vezes dá o mesmo estado', () => {
    const uma = recarrega(cenario('original'));
    const duas = recarrega(uma);
    // (campos de relógio do load variam entre cargas; a régua é a forma equipada)
    expect([duas.potionElement, duas.formaAltEquipada, duas.formasAlt, duas.formaSnapshots, duas.elementoJornada])
      .toEqual([uma.potionElement, uma.formaAltEquipada, uma.formasAlt, uma.formaSnapshots, uma.elementoJornada]);
  });
});
