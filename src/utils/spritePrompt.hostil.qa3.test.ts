/**
 * QA3 — `composeSpritePrompt*`: as DUAS variantes (legacy e v-pet), com e sem referências, com argumentos hostis.
 * Invariantes que o fallback de recusa do provedor (generate-sprite.js) e a regra de PI do dono exigem:
 *  · a variante LIMPA (`withReferences:false`) nunca cita franquia nem a inspiração do bestiário;
 *  · as DUAS pedem o fundo #00FF00, a frase anti-cópia e a direção do bicho;
 *  · a cláusula de renascimento entra nas duas;
 *  · argumentos ausentes nunca viram "undefined"/"null"/"[object" no texto enviado a um provedor PAGO.
 */
import { describe, it, expect } from 'vitest';
import { composeSpritePromptLegacy, composeSpritePromptVPet, type SpritePromptArgs } from './oracle/motor';
import { SPRITE_FACING_PROMPT } from './spritePose';

const FRANQUIAS = /Digimon|Pok[eé]mon|Monster Rancher|Yu-Gi-Oh|Warhammer|Palworld|Legend of Mana|Final Fantasy|Hello Kitty|Tamagotchi|Ragnarok|World of Warcraft/i;
const base: SpritePromptArgs = { concept: 'a fox mage', colorDesc: 'teal', accent: 'gold', levelBlock: 'a compact body', withReferences: true };
const VARIANTES = [['legacy', composeSpritePromptLegacy], ['v-pet', composeSpritePromptVPet]] as const;

describe('QA3 composeSpritePrompt', () => {
  for (const [nome, compor] of VARIANTES) {
    it(`${nome}: a variante limpa não cita franquia nem a inspiração; a com referências cita`, () => {
      const limpa = compor({ ...base, withReferences: false, inspiracao: 'Garuda do bestiário' });
      expect(limpa).not.toMatch(FRANQUIAS);
      expect(limpa).not.toContain('Garuda');
      const comRef = compor({ ...base, withReferences: true, inspiracao: 'Garuda do bestiário' });
      expect(comRef).toMatch(FRANQUIAS);
      expect(comRef).toContain('Garuda');
    });

    for (const withReferences of [true, false]) {
      it(`${nome} | refs=${withReferences}: fundo chroma, anti-cópia, direção e renascimento nas duas`, () => {
        const p = compor({ ...base, withReferences, rebirth: 'It has been reborn once.' });
        expect(p).toContain('#00FF00');
        expect(p).toContain('Do not copy any existing franchise character.');
        expect(p).toContain(SPRITE_FACING_PROMPT);
        expect(p).toContain('It has been reborn once.');
      });

      it(`${nome} | refs=${withReferences}: opcionais ausentes e strings vazias não viram undefined/null no prompt`, () => {
        for (const args of [base, { ...base, favoriteCreature: '', rebirth: '', inspiracao: '' }, { ...base, favoriteCreature: undefined, rebirth: undefined, inspiracao: undefined }]) {
          const p = compor({ ...args, withReferences } as SpritePromptArgs);
          expect(p).not.toMatch(/undefined|\bnull\b|\[object|NaN/);
          expect(p).not.toMatch(/\s{2,}/); // sem buracos de espaço onde um opcional faltou
        }
      });
    }

    it(`${nome}: o prompt de um bicho de nome gigante/estranho continua determinístico e sem lançar`, () => {
      const hostil = { ...base, favoriteCreature: 'x'.repeat(20000), concept: '${evil} `tick` \u0000 \n\n', colorDesc: '', accent: '' };
      expect(compor(hostil)).toBe(compor(hostil));
    });
  }
});
