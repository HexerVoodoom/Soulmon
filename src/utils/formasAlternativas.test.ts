import { describe, it, expect } from 'vitest';
import { altSpriteKey, registrarFormaAoEvoluir, equiparFormaAlt, spriteVisorOf, ocultasDaForma, sanitizeFormasAlt, sanitizeFormaAltEquipada, ALT_ORIGINAL } from './formasAlternativas';
import { emptySpriteLibrary } from './spriteLibrary';

const url = (n: string) => `https://cdn.example/${n}.png`;
const lib = (keys: string[]) => ({ ...emptySpriteLibrary(), sprites: Object.fromEntries(keys.map(k => [k, { url: url(k), formId: k, at: 1 }])) });

describe('formas alternativas (05/11/2026)', () => {
  it('primeira visita usa a chave da forma; outro elemento depois vira forma@elemento', () => {
    expect(altSpriteKey('champion-power', 'fogo', undefined)).toBe('champion-power');
    const r = registrarFormaAoEvoluir(undefined, undefined, 'champion-power', 'fogo');
    expect(r.formasAlt).toEqual({ 'champion-power': ['fogo'] });
    expect(altSpriteKey('champion-power', 'agua', r.formasAlt)).toBe('champion-power@agua');
    expect(altSpriteKey('champion-power', 'fogo', r.formasAlt)).toBe('champion-power');
    const r2 = registrarFormaAoEvoluir(r.formasAlt, r.formaAltEquipada, 'champion-power', 'agua');
    expect(r2.formasAlt?.['champion-power']).toEqual(['fogo', 'agua']);
    expect(r2.formaAltEquipada?.['champion-power']).toBe('agua');
    // idempotente
    expect(registrarFormaAoEvoluir(r2.formasAlt, r2.formaAltEquipada, 'champion-power', 'agua').formasAlt).toBe(r2.formasAlt);
  });

  it('rookie não tem formas alternativas', () => {
    expect(registrarFormaAoEvoluir(undefined, undefined, 'rookie', 'fogo').formasAlt).toBeUndefined();
    expect(altSpriteKey('rookie', 'fogo', undefined, lib(['rookie']))).toBe('rookie');
  });

  it('arte de antes da lista: a volta pede arte nova e a antiga fica como Original', () => {
    const l = lib(['mega-harmony']);
    expect(altSpriteKey('mega-harmony', 'gelo', undefined, l)).toBe('mega-harmony@gelo');
    const r = registrarFormaAoEvoluir(undefined, undefined, 'mega-harmony', 'gelo', lib(['mega-harmony', 'mega-harmony@gelo']));
    expect(r.formasAlt?.['mega-harmony']).toEqual([ALT_ORIGINAL, 'gelo']);
  });

  it('o visor troca a arte da forma pela alternativa equipada, e só se ela já existe', () => {
    const formas = { 'champion-power': ['fogo', 'agua'] };
    const v = spriteVisorOf(lib(['champion-power', 'champion-power@agua']), formas, { 'champion-power': 'agua' });
    expect(v.sprites['champion-power'].url).toBe(url('champion-power@agua'));
    const semArte = lib(['champion-power']);
    expect(spriteVisorOf(semArte, formas, { 'champion-power': 'agua' })).toBe(semArte);
  });

  it('equipar só o que foi desbloqueado; sempre 3 ocultas; sanitizador tolerante', () => {
    expect(equiparFormaAlt({ 'mega-power': ['fogo'] }, undefined, 'mega-power', 'agua')).toBeUndefined();
    expect(ocultasDaForma(undefined, 'mega-power')).toBe(3);
    expect(sanitizeFormasAlt({ 'mega-power': ['fogo', 'fogo', 7, 'X'], rookie: ['fogo'], lixo: 1 })).toEqual({ 'mega-power': ['fogo'] });
    expect(sanitizeFormaAltEquipada('x')).toBeUndefined();
  });
});
