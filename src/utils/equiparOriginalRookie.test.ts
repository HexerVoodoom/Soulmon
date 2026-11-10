/**
 * Bug do dono em produção (10/11/2026): "equipar a forma ORIGINAL do nível Ultimate equipa a Rookie". Reproduzido com as funções reais:
 * a 1ª da lista usa a chave da própria forma, mas a arte dela só existia em `forma@elemento`; o visor ficava sem arte da forma e
 * `getSpriteForStage` caía na 1ª arte do acervo (a Rookie).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { spriteVisorOf } from './formasAlternativas';
import { displaySprite } from './spriteLibrary';
import { getSpriteForStage, setOwnSprites } from './sprites';

afterEach(() => setOwnSprites({}));
const e = (url: string) => ({ url, formId: 'x', provider: 'p', at: 1 }) as any;

/** O que o App faz: acervo visto pelo visor → mapa de artes próprias → arte do estágio. */
function arteDoUltimate(lib: any, formas: any, equip: any): string {
  const visor = spriteVisorOf(lib, formas, equip);
  const map: Record<string, string> = {};
  for (const f of Object.keys(visor.sprites)) {
    if (f.includes('@')) continue;
    const u = displaySprite(visor, f)?.url;
    if (u) map[f] = u;
  }
  setOwnSprites(map);
  return getSpriteForStage('ultimate-harmony');
}

describe('equipar a forma original do Ultimate nunca mostra a Rookie', () => {
  const base = { failures: {}, pendingTune: null, reverted: [] };
  it('arte da 1ª da lista só na chave com elemento: equipar a original mostra o Ultimate', () => {
    const lib = { ...base, sprites: { rookie: e('ROOKIE'), 'ultimate-harmony@fogo': e('ULT-FOGO'), 'ultimate-harmony@agua': e('ULT-AGUA') } };
    const formas = { 'ultimate-harmony': ['fogo', 'agua'] };
    expect(arteDoUltimate(lib, formas, { 'ultimate-harmony': 'fogo' })).toBe('ULT-FOGO');
    expect(arteDoUltimate(lib, formas, { 'ultimate-harmony': 'agua' })).toBe('ULT-AGUA');
  });
  it('arte na chave própria segue valendo (original) e a alternativa troca', () => {
    const lib = { ...base, sprites: { rookie: e('ROOKIE'), 'ultimate-harmony': e('ULT-ORIG'), 'ultimate-harmony@fogo': e('ULT-FOGO') } };
    const formas = { 'ultimate-harmony': ['original', 'fogo'] };
    expect(arteDoUltimate(lib, formas, { 'ultimate-harmony': 'original' })).toBe('ULT-ORIG');
    expect(arteDoUltimate(lib, formas, { 'ultimate-harmony': 'fogo' })).toBe('ULT-FOGO');
  });
});
