import { describe, it, expect } from 'vitest';
import { opponentSprite, opponentIcon } from './opponentArt';

// Preview (ícone/sprite da lista) e duelo (`opponentSprite(duel.opp)`) leem a MESMA fonte: com `spriteUrl`, a artLine nunca vale.
describe('oponente com spriteUrl (simulado)', () => {
  const sim = { id: 'x', stage: 'rookie', artLine: 'igni', spriteUrl: 'https://soulmon.mateus-sprnd.workers.dev/api/sprite-image?k=e5857867b2921099ca8c94aa6ccab5af' };
  it('o sprite é o do simulado, em qualquer tamanho', () => {
    expect(opponentSprite(sim)).toBe('/api/sprite-image?k=e5857867b2921099ca8c94aa6ccab5af');
    expect(opponentSprite(sim, 256)).toBe(opponentSprite(sim));
  });
  it('o preview não cai no ícone-ficha da linha antiga: preview === duelo', () => {
    expect(opponentIcon(sim, 64)).toBeUndefined();
    expect(opponentIcon(sim, 64) ?? opponentSprite(sim)).toBe(opponentSprite(sim, 256));
  });
  it('sem spriteUrl continua na linha (retrocompatível)', () => {
    expect(opponentSprite({ ...sim, spriteUrl: null })).not.toContain('sprite-image');
  });
});
