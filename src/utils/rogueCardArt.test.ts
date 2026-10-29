import { describe, it, expect } from 'vitest';
import { indexCardArt, resolveCardArt, rogueCardArt, ROGUE_CARD_FILE } from './rogueCardArt';

describe('rogueCardArt', () => {
  it('resolve a arte quando o arquivo existe', () => {
    const art = indexCardArt({ '../assets/soulmon/dungeon-rogue/cards/card-combate.png': '/c.png', '../x/card-bonus-cura.png': '/h.png' });
    expect(resolveCardArt(art, 'combat')).toBe('/c.png');
    expect(resolveCardArt(art, 'heal')).toBe('/h.png');
  });
  it('devolve undefined sem arquivo ou com chave desconhecida', () => {
    expect(resolveCardArt({}, 'combat')).toBeUndefined();
    expect(resolveCardArt({ combate: '/c.png' }, 'puzzle')).toBeUndefined();
    expect(resolveCardArt({ combate: '/c.png' }, 'nope')).toBeUndefined();
  });
  it('mapeia os 7 cards e o resolvedor real não quebra sem arte', () => {
    expect(Object.keys(ROGUE_CARD_FILE).sort()).toEqual(['combat', 'explore', 'heal', 'minigame', 'power', 'puzzle', 'vigor']);
    for (const k of Object.keys(ROGUE_CARD_FILE)) expect(['string', 'undefined']).toContain(typeof rogueCardArt(k));
  });
});
