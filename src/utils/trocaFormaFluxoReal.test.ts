/**
 * Fluxo REAL do bug do dono (10/11/2026, reproduzido no app local): Soulmon com poção Fada dada em Harmonia (Ultimate), registro do
 * estágio Ultimate = Sabá, forma Poder sem foto nem alternativas. Trocar para Poder mantinha Fada (a poção da forma de saída seguia
 * valendo). Agora: a poção fica fotografada na forma de saída; a de chegada (sem foto) usa o registro/equipado dela.
 */
import { describe, it, expect } from 'vitest';
import { trocarFormaCompleta } from './formaSnapshot';
import { applyLateralSwitch } from './trocaLateral';
import { petElementOf } from './starterElements';
import { applyPotionOnEvolve } from './elementPotion';

const salvo = (): any => ({
  evolutionStage: 'ultimate-harmony',
  unlockedEvolutions: ['rookie', 'champion-harmony', 'champion-power', 'ultimate-harmony', 'ultimate-power'],
  elementoJornada: { v: 1, u: 0.5, estagios: { rookie: { id: 'sombra', base: 'sombra' }, ultimate: { id: 'sabbat', base: 'sombra' } } },
  potionElement: 'fada',
});
const trocar = (s: any, alvo: string) => trocarFormaCompleta(s, x => applyLateralSwitch(x, alvo));

describe('trocar de forma (fluxo real: poção Fada em Harmonia, estágio Sabá)', () => {
  it('Harmonia é Fada; Poder (sem foto, sem alternativa) passa a Sabá', () => {
    const s = salvo();
    expect(petElementOf(s)).toBe('fada');
    const poder = trocar(s, 'ultimate-power');
    expect(poder.evolutionStage).toBe('ultimate-power');
    expect(poder.potionElement).toBeUndefined();
    expect(petElementOf(poder)).toBe('sabbat');
  });
  it('voltar a Harmonia restaura a poção Fada (ficou fotografada na saída)', () => {
    const volta = trocar(trocar(salvo(), 'ultimate-power'), 'ultimate-harmony');
    expect(petElementOf(volta)).toBe('fada');
  });
  it('o elemento da troca não é permanente: evoluir de novo (sem poção nova) volta ao base', () => {
    const poder = trocar(salvo(), 'ultimate-power');
    expect(applyPotionOnEvolve({ ...poder, evolutionStage: 'mega-power' }).potionElement).toBeUndefined();
  });
  it('forma com elemento equipado vale esse elemento; igual ao do registro = sem poção', () => {
    const s = { ...salvo(), formasAlt: { 'ultimate-power': ['sabbat'] }, formaAltEquipada: { 'ultimate-power': 'sabbat' } };
    expect(petElementOf(trocar(s, 'ultimate-power'))).toBe('sabbat');
    const s2 = { ...salvo(), formaAltEquipada: { 'ultimate-power': 'luz' } };
    expect(petElementOf(trocar(s2, 'ultimate-power'))).toBe('luz');
  });
});
