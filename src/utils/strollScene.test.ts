import { describe, it, expect } from 'vitest';
import { panOffsetPx, SCENE_FOUND_X, SCENE_PLAYER_X, SCENE_RATIO, SCENE_GROUND_Y } from './strollScene';

describe('o deslize da cena do Passeio', () => {
  const vh = 844, vw = 390, trackW = vh * SCENE_RATIO;
  it('numa tela vertical o panorama 2:1 desliza do jogador (esquerda) para o descoberto (direita), preso às bordas', () => {
    const a = panOffsetPx(SCENE_PLAYER_X, trackW, vw);
    const b = panOffsetPx(SCENE_FOUND_X, trackW, vw);
    expect(a).toBeLessThanOrEqual(0);
    expect(b).toBeLessThan(a);
    expect(b).toBeGreaterThanOrEqual(vw - trackW);
    // O Soulmon fica centrado enquanto há margem.
    expect(Math.round((SCENE_PLAYER_X / 100) * trackW + a)).toBeCloseTo(vw / 2, -1);
  });
  it('num celular deitado (tela mais larga que o panorama) não desliza: os dois já cabem', () => {
    expect(panOffsetPx(SCENE_FOUND_X, 800, 1200)).toBe(0);
  });
  it('medidas inválidas não explodem', () => {
    expect(panOffsetPx(25, 0, 390)).toBe(0);
    expect(panOffsetPx(25, 800, 0)).toBe(0);
  });
  it('os pés caem na linha de chão pedida à arte', () => {
    expect(SCENE_GROUND_Y).toBeGreaterThan(60);
    expect(SCENE_GROUND_Y).toBeLessThan(95);
  });
});
