/** A descida do foco larga do ponto escolhido no mapa do Rift e o consome (REGISTRO §452). */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import { startFocusDescent } from './focusDescent';
import { rewindToSet } from './riftMap';

const T0 = Date.UTC(2026, 10, 16, 15, 0, 0);
const estado = (): GameState => ({
  foodInventory: {}, gamePoints: 0, energyPoints: 8, totalXP: 5_000_000, evolutionStage: 'ultimate', dungeonDepthRecord: 21,
} as unknown as GameState);

describe('descida do foco × volta do mapa', () => {
  it('sem volta: larga do ponto de retorno do recorde', () => {
    expect(startFocusDescent(estado(), T0, 7, T0 + 25 * 60_000).dungeonAway?.layer).toBe(21);
  });
  it('com volta ao nó 2: larga do andar 5, consome o campo e o recorde fica', () => {
    const volta = rewindToSet(estado(), 2);
    expect(volta.dungeonResumeLayer).toBe(5);
    const next = startFocusDescent(volta, T0, 7, T0 + 25 * 60_000);
    expect(next.dungeonAway?.layer).toBe(5);
    expect(next.dungeonResumeLayer).toBeUndefined();
    expect(next.dungeonDepthRecord).toBe(21);
  });
});
