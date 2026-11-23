/**
 * Poção elemental × troca de forma, ponta a ponta (bugs do dono em teste, 10/11/2026):
 * 1) a poção entra no prompt da criatura; 2) trocar para forma de outra linha leva o elemento dela e não pede imagem nova;
 * 3) o elemento da poção/forma NUNCA vira permanente — a próxima evolução volta ao base.
 */
import { describe, it, expect } from 'vitest';
import { stagesComElemento } from './elementoCombinado';
import { trocarFormaCompleta } from './formaSnapshot';
import { applyLateralSwitch } from './trocaLateral';
import { applyPotionOnEvolve } from './elementPotion';
import { petElementOf } from './starterElements';
import { altSpriteKey, elementoEquipavelComArte, equiparFormaAlt, type FormasAlt } from './formasAlternativas';

const st = (stage: string) => ({ stage, imagePrompt: `prompt ${stage}`, imagePromptFallback: `fallback ${stage}` });
const jornada = (estagios: Record<string, { id: string; base: string }>) => ({ v: 1 as const, u: 0.5, estagios });

describe('1) a poção entra no prompt da criatura', () => {
  it('poção: o tema elemental vira palavra-chave do estágio dela', () => {
    const out = stagesComElemento([st('champion'), st('ultimate')], jornada({ champion: { id: 'sombra', base: 'sombra' } }), { ultimate: 'fada' })!;
    expect(out[1].imagePrompt).toContain('Elemental theme of this form:');
    expect(out[1].imagePromptFallback).toContain('Elemental theme of this form:');
    expect(out[0].imagePrompt.startsWith('prompt champion')).toBe(true); // o champion leva as pistas do elemento do estágio, não a poção
  });
  it('a poção vence o registro do estágio (como em petElementOf)', () => {
    const j = jornada({ ultimate: { id: 'sombra', base: 'sombra' } });
    const sem = stagesComElemento([st('ultimate')], j)![0].imagePrompt;
    const com = stagesComElemento([st('ultimate')], j, { ultimate: 'fada' })![0].imagePrompt;
    expect(com).not.toBe(sem);
    expect(com.match(/Elemental theme of this form/g)).toHaveLength(1);
  });
  it('sem poção e sem registro nada muda', () => {
    const lista = [st('rookie')];
    expect(stagesComElemento(lista, undefined, undefined)).toBe(lista);
  });
});

describe('2) trocar para forma de outra linha leva o elemento dela', () => {
  const salvo = (): any => ({
    evolutionStage: 'ultimate-harmony',
    unlockedEvolutions: ['ultimate-harmony', 'ultimate-power'],
    elementoJornada: jornada({ ultimate: { id: 'fada', base: 'fada' } }),
    formasAlt: { 'ultimate-power': ['fogo', 'sabbat'] } as FormasAlt,
    formaAltEquipada: { 'ultimate-power': 'sabbat', 'ultimate-harmony': 'fada' },
  });
  it('sem foto da forma: o elemento equipado dela vira o do Soulmon (Fada para Saba)', () => {
    const prev = salvo();
    expect(petElementOf(prev)).toBe('fada');
    const next = trocarFormaCompleta(prev, s => applyLateralSwitch(s, 'ultimate-power'));
    expect(next.evolutionStage).toBe('ultimate-power');
    expect(petElementOf(next)).toBe('sabbat');
  });
  it('NÃO é permanente: o registro do estágio fica intacto e a próxima evolução volta ao base', () => {
    const next = trocarFormaCompleta(salvo(), s => applyLateralSwitch(s, 'ultimate-power'));
    expect(next.elementoJornada.estagios.ultimate).toEqual({ id: 'fada', base: 'fada' });
    const evoluiu = applyPotionOnEvolve({ ...next, evolutionStage: 'mega-power' });
    expect(evoluiu.potionElement).toBeUndefined();
    const comPocao = applyPotionOnEvolve({ ...next, evolutionPotion: 'luz', evolutionStage: 'mega-power' });
    expect(comPocao.potionElement).toBe('luz');
  });
  it('voltar à forma de origem restaura o elemento dela', () => {
    const ida = trocarFormaCompleta(salvo(), s => applyLateralSwitch(s, 'ultimate-power'));
    const volta = trocarFormaCompleta(ida, s => applyLateralSwitch(s, 'ultimate-harmony'));
    expect(petElementOf(volta)).toBe('fada');
  });
  it('não pede imagem nova: o elemento equipado ao entrar é um que JÁ tem arte no acervo', () => {
    const formas: FormasAlt = { 'ultimate-power': ['fogo', 'sabbat'] };
    const lib: any = { sprites: { 'ultimate-power': { url: 'x' } } };
    expect(altSpriteKey('ultimate-power', 'sabbat', formas, lib)).toBe('ultimate-power@sabbat');
    const el = elementoEquipavelComArte('ultimate-power', formas, { 'ultimate-power': 'sabbat' }, lib);
    expect(el).toBe('fogo');
    const eq = equiparFormaAlt(formas, undefined, 'ultimate-power', el!);
    expect(lib.sprites[altSpriteKey('ultimate-power', eq!['ultimate-power'], formas, lib)]).toBeTruthy();
  });
  it('com a arte do pedido existindo, o pedido vale', () => {
    const formas: FormasAlt = { 'ultimate-power': ['fogo', 'sabbat'] };
    const lib: any = { sprites: { 'ultimate-power': { url: 'x' }, 'ultimate-power@sabbat': { url: 'y' } } };
    expect(elementoEquipavelComArte('ultimate-power', formas, undefined, lib, 'sabbat')).toBe('sabbat');
  });
});

describe('equipar na forma ORIGINAL do mesmo nível não aponta para chave sem arte', () => {
  it('equipar a original (sentinela) com arte só na chave da forma mantém essa arte', () => {
    const formas: FormasAlt = { 'ultimate-power': ['original', 'fogo'] };
    const lib: any = { sprites: { 'ultimate-power': { url: 'orig' } } };
    expect(elementoEquipavelComArte('ultimate-power', formas, { 'ultimate-power': 'fogo' }, lib, 'original')).toBe('original');
  });
  it('variante pedida sem imagem cai na que tem (nunca a de outro nível)', () => {
    const formas: FormasAlt = { 'ultimate-power': ['original', 'fogo'] };
    const lib: any = { sprites: { 'ultimate-power': { url: 'orig' } } };
    const el = elementoEquipavelComArte('ultimate-power', formas, undefined, lib, 'fogo');
    expect(el).toBe('original');
    expect(altSpriteKey('ultimate-power', el, formas, lib)).toBe('ultimate-power');
  });
});
