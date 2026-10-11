import { describe, it, expect } from 'vitest';
import { artFacesLeft, LEFT_FACING_LINES, DUNGEON_LINE_SPRITES } from './sprites';

describe('para onde a arte olha', () => {
  it('linhas de perfil esquerdo são declaradas; as demais olham para a direita/de frente', () => {
    expect(artFacesLeft('rookie', 'igni')).toBe(true);
    expect(artFacesLeft('champion', 'nautilu')).toBe(true);
    expect(artFacesLeft('rookie', 'kaelen')).toBe(true);
    expect(artFacesLeft('rookie', 'corvo')).toBe(true);
    expect(artFacesLeft('rookie', 'ignar')).toBe(false);
    expect(artFacesLeft('champion-power')).toBe(false); // árvore do Soulmon
  });
  it('só declara linhas que existem', () => {
    for (const l of LEFT_FACING_LINES) if (l !== 'corvo') expect(DUNGEON_LINE_SPRITES[l]).toBeTruthy();
  });
});
