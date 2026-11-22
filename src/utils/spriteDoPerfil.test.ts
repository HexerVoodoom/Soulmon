import { describe, it, expect } from 'vitest';
import { spriteDoPerfilUrl } from './spriteDoPerfil';
import { emptySpriteLibrary, type SpriteLibrary } from './spriteLibrary';

const e = (url: string, formId: string) => ({ url, formId, provider: 'p', at: 1 }) as never;
const lib = (sprites: Record<string, unknown>): SpriteLibrary => ({ ...emptySpriteLibrary(), sprites: sprites as never });

describe('sprite publicado no perfil (Bosque/Maslin)', () => {
  it('estágio atual com arte: usa a dele', () => {
    expect(spriteDoPerfilUrl(lib({ rookie: e('r', 'rookie'), 'ultimate-x': e('u', 'ultimate-x') }), 'ultimate-x', ['rookie', 'ultimate-x'])).toBe('u');
  });
  it('estágio atual sem arte: a última já alcançada, NUNCA o rookie por ser a 1ª do acervo', () => {
    const l = lib({ rookie: e('r', 'rookie'), 'champion-x': e('c', 'champion-x') });
    expect(spriteDoPerfilUrl(l, 'ultimate-x', ['rookie', 'champion-x', 'ultimate-x'])).toBe('c');
  });
  it('só o rookie existe: publica o rookie (é de fato a última alcançada)', () => {
    expect(spriteDoPerfilUrl(lib({ rookie: e('r', 'rookie') }), 'champion-x', ['rookie', 'champion-x'])).toBe('r');
  });
  it('arte de estágio não alcançado não entra; acervo vazio => null', () => {
    expect(spriteDoPerfilUrl(lib({ 'mega-z': e('m', 'mega-z') }), 'rookie', ['rookie'])).toBeNull();
    expect(spriteDoPerfilUrl(lib({}), 'rookie', undefined)).toBeNull();
  });
});
