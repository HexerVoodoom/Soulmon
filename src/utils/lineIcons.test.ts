/**
 * Os ícones-ficha (rodada 2, R2-2) têm de ser ENCONTRÁVEIS — a lição do
 * `attackFxArt` (924 no mapa, nenhum achável). 9 linhas × 4 tiers × 2 tamanhos.
 */
import { describe, it, expect } from 'vitest';
import { lineIcon, lineIconForStage, LINE_ICON_COUNT } from './lineIcons';
import { DUNGEON_LINE_SPRITES } from './sprites';

describe('lineIcons', () => {
  it('72 ícones no mapa (9 linhas × 4 tiers × 32/64)', () => {
    expect(LINE_ICON_COUNT).toBe(72);
  });

  it('toda linha × tier é encontrável nos dois tamanhos (inclusive kaelen, cujo arquivo tem `-power`)', () => {
    for (const line of Object.keys(DUNGEON_LINE_SPRITES)) {
      for (const tier of ['rookie', 'champion', 'ultimate', 'mega'] as const) {
        expect(lineIcon(line, tier, 64), `${line}:${tier}:64`).toMatch(/lines\/icons\/.*-64\.png$/);
        expect(lineIcon(line, tier, 32), `${line}:${tier}:32`).toMatch(/lines\/icons\/.*-32\.png$/);
      }
    }
  });

  it('lineIconForStage: demo → a linha escolhida; legado → linha por hash; árvore do jogador → undefined', () => {
    expect(lineIconForStage('champion-power', 64, 'ignar')).toMatch(/ignar-champion-64\.png$/);
    expect(lineIconForStage('ultra', 32, 'serah')).toMatch(/serah-mega-32\.png$/);
    expect(lineIconForStage('agumon', 32)).toMatch(/-rookie-32\.png$/);
    expect(lineIconForStage('agumon', 32)).toBe(lineIconForStage('agumon', 32)); // determinístico
    expect(lineIconForStage('champion-power', 64)).toBeUndefined();
    expect(lineIconForStage('rookie', 64)).toBeUndefined();
  });
});
