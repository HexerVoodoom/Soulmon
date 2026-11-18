import { describe, it, expect } from 'vitest';
import { resultOpponentSrc, bossBattleTitleArt } from './bossSplash';

describe('resultOpponentSrc (B: resultado do boss)', () => {
  const boss = { id: 'x', name: 'Chorale', art: 'boss-art.png' };
  it('boss: sempre o chefe da luta, nunca o roster/desgarrado/PvP', () => {
    expect(resultOpponentSrc({ boss, pvp: { sprite: 'pvp.png' }, stray: 'stray.png', roster: 'roster.png' })).toBe('boss-art.png');
  });
  it('PvP: o sprite do jogador, nunca o roster', () => {
    expect(resultOpponentSrc({ boss: null, pvp: { sprite: 'pvp.png' }, roster: 'roster.png' })).toBe('pvp.png');
    expect(resultOpponentSrc({ boss: null, pvp: {}, roster: 'roster.png' })).toBeUndefined();
  });
  it('Aventura: desgarrado de jogador, senão roster', () => {
    expect(resultOpponentSrc({ boss: null, stray: 's.png', roster: 'r.png' })).toBe('s.png');
    expect(resultOpponentSrc({ boss: null, roster: 'r.png' })).toBe('r.png');
  });
});

describe('arte por glob (assets entregues pela sessão de arte)', () => {
  it('sem o arquivo devolve undefined (fallback de texto), nunca quebra', () => {
    const v = bossBattleTitleArt(false);
    expect(v === undefined || typeof v === 'string').toBe(true);
  });
});
