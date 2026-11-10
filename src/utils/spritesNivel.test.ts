import { describe, it, expect, afterEach } from 'vitest';
import { getSpriteForStage, setOwnSprites } from './sprites';

afterEach(() => setOwnSprites({}));

describe('arte da forma sem chave própria (bug "equipar a original vira a Rookie")', () => {
  it('sem arte na chave, usa a de outra forma do MESMO nível antes da 1ª do acervo', () => {
    setOwnSprites({ rookie: 'ROOKIE.png', 'ultimate-power': 'ULT-PODER.png' });
    expect(getSpriteForStage('ultimate-harmony')).toBe('ULT-PODER.png');
  });
  it('com a chave própria, ela vale', () => {
    setOwnSprites({ rookie: 'ROOKIE.png', 'ultimate-harmony': 'ULT-HARM.png', 'ultimate-power': 'ULT-PODER.png' });
    expect(getSpriteForStage('ultimate-harmony')).toBe('ULT-HARM.png');
  });
  it('sem nenhuma do nível, mantém o comportamento de antes (1ª do acervo)', () => {
    setOwnSprites({ rookie: 'ROOKIE.png' });
    expect(getSpriteForStage('ultimate-harmony')).toBe('ROOKIE.png');
  });
});
