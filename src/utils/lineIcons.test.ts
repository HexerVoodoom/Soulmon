/**
 * Os ícones-ficha (rodada 2, R2-2) têm de ser ENCONTRÁVEIS — a lição do
 * `attackFxArt` (924 no mapa, nenhum achável). 6 linhas × 4 tiers × 2 tamanhos (D-78: eram 9).
 */
import { describe, it, expect } from 'vitest';
import { lineIcon, lineIconForStage, LINE_ICON_COUNT } from './lineIcons';
import { DUNGEON_LINE_SPRITES } from './sprites';

describe('lineIcons', () => {
  it('32 ícones no mapa (4 linhas × 4 tiers × 32/64; D-78 tirou orrin/serah/nautilu; 20/10 tirou ignar/lumel)', () => {
    expect(LINE_ICON_COUNT).toBe(32);
  });

  it('toda linha × tier é encontrável nos dois tamanhos (inclusive kaelen, cujo arquivo tem `-power`)', () => {
    for (const line of Object.keys(DUNGEON_LINE_SPRITES)) {
      for (const tier of ['rookie', 'champion', 'ultimate', 'mega'] as const) {
        expect(lineIcon(line, tier, 64), `${line}:${tier}:64`).toMatch(/lines\/icons\/.*-64\.png$/);
        expect(lineIcon(line, tier, 32), `${line}:${tier}:32`).toMatch(/lines\/icons\/.*-32\.png$/);
      }
    }
  });

  it('lineIconForStage: demo → a linha escolhida; legado → inicial de reserva (sem ícone); árvore do jogador → undefined', () => {
    expect(lineIconForStage('champion-power', 64, 'igni')).toMatch(/igni-champion-64\.png$/);
    expect(lineIconForStage('ultra', 32, 'thalindra')).toMatch(/thalindra-mega-32\.png$/);
    expect(lineIconForStage('ultra', 32, 'ignar')).toBeUndefined();
    expect(lineIconForStage('ultra', 32, 'lumel')).toBeUndefined();
    // D-78: linha aposentada → inicial de reserva (sem ícone-ficha), nunca o ícone da linha velha
    expect(lineIconForStage('ultra', 32, 'serah')).toBeUndefined();
    // D-104: id legado sem linha → piso = inicial atual (sem ícone-ficha); a arte vem de getSpriteForStage
    expect(lineIconForStage('agumon', 32)).toBeUndefined();
    expect(lineIconForStage('champion-power', 64)).toBeUndefined();
    expect(lineIconForStage('rookie', 64)).toBeUndefined();
  });
});
