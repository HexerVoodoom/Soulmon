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

// 14/10/2026 — auditoria dos 5 iniciais (docs/AUDITORIA-FACING-GRATUITOS.md): o Bolid (`meteoro`) olha para a ESQUERDA.
describe('os iniciais: para onde a arte olha', () => {
  it('meteoro declara a esquerda; os demais iniciais não (direita ou de frente)', async () => {
    const { artFacesLeft, STARTER_IDS, LEFT_FACING_STARTERS } = await import('./sprites');
    for (const id of STARTER_IDS) expect(artFacesLeft('rookie', id), id).toBe(id === 'meteoro');
    expect([...LEFT_FACING_STARTERS]).toEqual(['meteoro']);
  });
});

describe('spriteUrlFacesLeft (o combate lê a URL)', () => {
  it('arte de perfil esquerdo é reconhecida; direita/de frente/própria não', async () => {
    const { spriteUrlFacesLeft, getSpriteForStage } = await import('./sprites');
    expect(spriteUrlFacesLeft(getSpriteForStage('rookie', 'igni'))).toBe(true);
    expect(spriteUrlFacesLeft(getSpriteForStage('rookie', 'meteoro'))).toBe(true);
    expect(spriteUrlFacesLeft(getSpriteForStage('rookie', 'ignar'))).toBe(false);
    expect(spriteUrlFacesLeft(getSpriteForStage('rookie', 'nascente'))).toBe(false);
    expect(spriteUrlFacesLeft('https://cdn/sprite-gerado.png')).toBe(false);
    expect(spriteUrlFacesLeft(undefined)).toBe(false);
  });
});
