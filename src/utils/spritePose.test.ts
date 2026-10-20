import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  applySpritePose, registerSpritePoseWriter, sanitizeSpritePose, mergeSpritePose, mirrorSprite,
  SPRITE_FACING_PROMPT, DEFAULT_SPRITE_POSE,
} from './spritePose';

describe('sanitizeSpritePose', () => {
  it('lixo vira o padrão (chão, sem espelho)', () => {
    for (const raw of [null, undefined, 0, 'air', [], [1], { flipX: 'true', altitude: 'AIR' }, { altitude: 1 }]) {
      expect(sanitizeSpritePose(raw)).toEqual(DEFAULT_SPRITE_POSE);
    }
  });
  it('mantém só valores literais válidos', () => {
    expect(sanitizeSpritePose({ flipX: true, altitude: 'air', extra: 1 })).toEqual({ flipX: true, altitude: 'air' });
  });
});

describe('mirrorSprite — a "frente" inverte com flipX', () => {
  // [andaEsquerda, arteOlhaEsquerda, flipX] -> espelha?
  const tabela: Array<[boolean, boolean, boolean, boolean]> = [
    [false, false, false, false], // arte direita, anda direita: igual
    [true, false, false, true],   // arte direita, anda esquerda: espelha
    [false, true, false, true],   // arte esquerda, anda direita: espelha
    [true, true, false, false],
    [false, false, true, true],   // flipX: a arte "passa a olhar" esquerda, anda direita -> espelha
    [true, false, true, false],
    [false, true, true, false],
    [true, true, true, true],
  ];
  it.each(tabela)('anda esq=%s arte esq=%s flipX=%s -> %s', (a, b, c, esperado) => {
    expect(mirrorSprite(a, b, c)).toBe(esperado);
  });
});

describe('applySpritePose — único dono de escrita', () => {
  let off: (() => void) | undefined;
  afterEach(() => { off?.(); off = undefined; });

  it('sem estado montado devolve null e não lança', () => {
    expect(applySpritePose({ flipX: true })).toBeNull();
  });
  it('repassa só o patch válido ao writer e devolve o que aplicou', () => {
    const w = vi.fn();
    off = registerSpritePoseWriter(w);
    expect(applySpritePose({ altitude: 'air' })).toEqual({ altitude: 'air' });
    expect(applySpritePose({ flipX: false, altitude: 'ground' })).toEqual({ flipX: false, altitude: 'ground' });
    expect(w).toHaveBeenCalledTimes(2);
  });
  it('ignora valor inválido e patch vazio', () => {
    const w = vi.fn();
    off = registerSpritePoseWriter(w);
    expect(applySpritePose({ altitude: 'moon' as never, flipX: 'sim' as never })).toBeNull();
    expect(applySpritePose({})).toBeNull();
    expect(w).not.toHaveBeenCalled();
  });
  it('mergeSpritePose aceita estado anterior corrompido', () => {
    expect(mergeSpritePose('lixo', { altitude: 'air' })).toEqual({ flipX: false, altitude: 'air' });
    expect(mergeSpritePose({ flipX: true, altitude: 'air' }, { altitude: 'ground' })).toEqual({ flipX: true, altitude: 'ground' });
  });
});

describe('a frase de direção do prompt de geração', () => {
  it('manda o bicho virado para a DIREITA — a frente que o render do app espera', () => {
    expect(SPRITE_FACING_PROMPT).toMatch(/faces RIGHT/);
    expect(SPRITE_FACING_PROMPT).toMatch(/never facing left/);
  });

  it('pede 3/4 na diagonal para o observador, não perfil puro (20/10/2026)', () => {
    expect(SPRITE_FACING_PROMPT).toMatch(/Three-quarter view/);
    expect(SPRITE_FACING_PROMPT).toMatch(/not a pure side profile/);
  });
});
