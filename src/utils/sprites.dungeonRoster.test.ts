import { describe, it, expect } from 'vitest';
import { DUNGEON_LINE_SPRITES, getDungeonEnemySprite } from './sprites';
import { LEGACY_FORM_TIERS } from '../types/progression';

/**
 * WP4.9 — o roster da masmorra é `DUNGEON_LINE_SPRITES` (6 linhas nossas), e
 * NUNCA `LEGACY_FORM_TIERS` (ids de espécie legada, só para nível de save antigo).
 * O plano chegou a afirmar um "bestiário de 60 nomes invisíveis" a partir de um
 * comentário morto em progression.ts; este teste impede que a confusão volte.
 */
describe('roster da masmorra (WP4.9)', () => {
  const lines = Object.keys(DUNGEON_LINE_SPRITES);
  const legacyIds = new Set(Object.values(LEGACY_FORM_TIERS).flat());

  it('tem exatamente 6 linhas, cada uma com as 4 artes', () => {
    expect(lines).toHaveLength(6);
    for (const l of lines) {
      for (const stage of ['rookie', 'champion', 'ultimate', 'mega'] as const) {
        expect(typeof DUNGEON_LINE_SPRITES[l][stage]).toBe('string');
      }
    }
  });

  it('getDungeonEnemySprite só devolve linhas nossas, com nome, para todo tier', () => {
    for (const tier of ['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega', 'ultra']) {
      for (let i = 0; i < 30; i++) {
        const e = getDungeonEnemySprite(tier);
        expect(lines).toContain(e.line);
        expect(e.name.length).toBeGreaterThan(0);
        expect(legacyIds.has(e.line)).toBe(false);
      }
    }
  });

  it('excludeLine tira a linha do jogador do sorteio', () => {
    for (let i = 0; i < 50; i++) expect(getDungeonEnemySprite('rookie', 'ignar').line).not.toBe('ignar');
  });
});
