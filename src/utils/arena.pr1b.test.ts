/** PR1b (B1, Arena): só a carga dispara o especial; a torcida cheia só multiplica. */
import { describe, it, expect } from 'vitest';
import { arenaTurnIsSpecial, arenaTorcidaTurn, SPECIAL_CHARGE_TURNS, ARENA_TORCIDA_MULT } from './arena';
import { TORCIDA_TAPS_FULL } from './torcida';

describe('B1 Arena — uma barra = um uso', () => {
  it('gauge da torcida cheio com carga incompleta NÃO emite especial (só multiplica)', () => {
    expect(arenaTurnIsSpecial(SPECIAL_CHARGE_TURNS - 1, TORCIDA_TAPS_FULL)).toBe(false);
    expect(arenaTorcidaTurn(TORCIDA_TAPS_FULL).mult).toBe(ARENA_TORCIDA_MULT);
  });
  it('carga cheia emite especial (com ou sem torcida)', () => {
    expect(arenaTurnIsSpecial(SPECIAL_CHARGE_TURNS, 0)).toBe(true);
    expect(arenaTurnIsSpecial(SPECIAL_CHARGE_TURNS, TORCIDA_TAPS_FULL)).toBe(true);
  });
});
