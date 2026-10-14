/** Contrato do template v-pet (§46) + backup legacy. Exemplos EX1/EX2 do dono (14/10/2026). */
import { describe, it, expect } from 'vitest';
import { composeSpritePromptVPet, composeSpritePromptLegacy } from './oracle/motor';
import { SPRITE_FACING_PROMPT } from './spritePose';

const REFS = 'Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft';
const EX1 = { concept: 'crocodile, Void Mage, magmatic', levelBlock: 'in its final form, it is a smoldering iron kaiju with furnace eyes', colorDesc: 'dark violet and ash-gray', accent: 'red' };
const EX2 = { concept: 'manticore, Void Mage, blazing', levelBlock: 'it has transformed into a spectral reaper wraith carrying a great scythe', colorDesc: 'deep purple and charcoal', accent: 'red' };

describe('template v-pet', () => {
  for (const [nome, ex] of [['EX1', EX1], ['EX2', EX2]] as const) {
    it(`${nome}: estrutura do exemplo do dono`, () => {
      const p = composeSpritePromptVPet({ ...ex, withReferences: true });
      expect(p).toBe(
        `Generate this RPG creature inspired by ${REFS}. Do not copy any existing franchise character. ` +
        `Tamagotchi-style v-pet sprite, 16x16 pixel art, transparent background, isolated subject, no backdrop, no checkerboard: ` +
        `${ex.concept}. ${ex.levelBlock}. ${SPRITE_FACING_PROMPT} ` +
        `Flat ${ex.colorDesc} colors with ${ex.accent} accents, no shading, no outlines, no anti-aliasing.`,
      );
    });
    it(`${nome}: fallback sem franquia, com cláusulas de segurança`, () => {
      const p = composeSpritePromptVPet({ ...ex, withReferences: false });
      for (const m of ['Digimon', 'Pok', 'Tamagotchi', 'Warhammer', 'Hello Kitty']) expect(p).not.toContain(m);
      expect(p).toContain('Do not copy any existing franchise character');
      expect(p).toContain(SPRITE_FACING_PROMPT);
      expect(p).toContain('no backdrop, no checkerboard');
    });
  }
  it('rebirth entra nas duas variantes', () => {
    for (const w of [true, false]) expect(composeSpritePromptVPet({ ...EX1, rebirth: 'Reborn.', withReferences: w })).toContain('Reborn.');
  });
  it('legacy preserva o texto antigo', () => {
    const p = composeSpritePromptLegacy({ ...EX1, withReferences: true });
    expect(p.startsWith('Generate an original creature for a monster-raising RPG inspired by')).toBe(true);
    expect(p).toContain('Do not tint the whole creature in a single hue');
  });
});
